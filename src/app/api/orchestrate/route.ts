import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";

import { generateSchema } from "@/lib/schemas";
import { agentGraph } from "@/agents";
import { buddyAgent } from "@/agents/specialists/buddyAgent";
import { getEntitlement } from "@/lib/entitlement";
import { Conversation } from "@/models/Conversation";
import { connectToDb } from "@/lib/db";

export const runtime = "nodejs";

/**
 * Fast-path eligibility:
 *   - plain text (not multimodal),
 *   - short (< 80 chars),
 *   - no slash-command (those need the full graph),
 *   - matches a known small-talk pattern.
 *
 * When eligible, the route bypasses safety/intent/sentiment/supervisor
 * and streams from buddyAgent directly. Trades the orchestration overhead
 * (~5 LLM calls) for a single LLM call → first token in ~1-2s instead
 * of ~30s on free OpenRouter tiers.
 */
const FAST_PATH_PATTERNS: RegExp[] = [
  /^(hi+|hello+|hey+|hola|namaste|namastey|yo|sup|hii+|heyy+)\b/i,
  /^(thanks?|thank\s*you|thx|ty|tysm)\b/i,
  /^(who\s+(are|r)\s+(you|u)|what'?s?\s+your\s+name|what\s+(are|r)\s+(you|u))\b/i,
  /^(what\s+can\s+(you|u)\s+do|what\s+do\s+(you|u)\s+do|how\s+do\s+(you|u)\s+work)\b/i,
  /^(how\s+(are|r)\s+(you|u)|how\s*'?s?\s+(it\s+going|everything)|what\s*'?s?\s+up)\b/i,
  /^(good\s+(morning|evening|night|afternoon))\b/i,
  /^(bye|goodbye|see\s*ya|cya|gn|gtg|ttyl)\b/i,
  /^(ok|okay|cool|nice|great|awesome|got\s+it|sure|alright|right|yes|yep|yeah|no|nope|nah)[\s.!?]*$/i,
  /^(lol|lmao|haha+|hehe+|omg|wow)\b/i,
];

function isFastPathEligible(latestText: string, isMultimodal: boolean): boolean {
  if (isMultimodal) return false;
  const trimmed = latestText.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("/")) return false;
  if (trimmed.length > 80) return false;
  return FAST_PATH_PATTERNS.some((p) => p.test(trimmed));
}

function sanitizeContent(content: any): any {
  if (typeof content === "string") {
    return content
      .replace(/<script\b[^<]*(?:(?!<script)<[^<]*)*<\/script>/gi, "")
      .replace(/javascript:/gi, "")
      .replace(/on\w+\s*=/gi, "")
      .replace(/eval\s*\(/gi, "");
  }
  if (Array.isArray(content)) {
    return content.map((part: any) => {
      if (part.type === "text" && part.text) {
        return { ...part, text: sanitizeContent(part.text) };
      }
      return part;
    });
  }
  return content;
}

const FALLBACK_REPLIES: Record<string, string> = {
  friendly: `Hi there! Thanks for reaching out. I'm here to chat, help, and connect with you. What's on your mind?`,
  happy: `Wow, it's great to hear from you! I'm so happy you're here! What would you like to talk about?`,
  sad: `Hey, I'm here for you. Even when things feel tough, remember you're not alone. Want to share what's going on?`,
  funny: `Haha, good to see you! 😄 You've got my full attention. What's funny today?`,
  motivational: `You've got this! 🚀 Every step forward counts. I'm here to support your journey. What's your goal?`,
  romantic: `💝 It's so wonderful to connect with you. Tell me what's in your heart...`,
  philosophical: `Interesting question... Let's explore this together. What are your thoughts?`,
  angry: `I hear you. Let's work through this together. What's troubling you?`,
};

const encoder = new TextEncoder();
const sse = (data: any) => encoder.encode(`data: ${JSON.stringify(data)}\n\n`);

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (!token?.id) {
    console.log("[orchestrate] No token - unauthorized");
    return jsonError("Unauthorized", 401);
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }
  console.log("[orchestrate] Body:", JSON.stringify(body).slice(0, 300));

  const parsed = generateSchema.safeParse(body);
  if (!parsed.success) {
    console.log("[orchestrate] Schema error:", parsed.error.issues);
    return jsonError(`Invalid: ${parsed.error.issues[0]?.message}`, 400);
  }

  const { messages, mood, conversationId } = parsed.data;

  const langchainMessages = messages.map((m: any) => {
    let content = sanitizeContent(m.content);
    if (!content && m.parts && Array.isArray(m.parts)) {
      content = m.parts.map((part: any) => {
        if (part.type === "text") return { type: "text", text: sanitizeContent(part.text) };
        if (part.type === "image") return { type: "image_url", image_url: part.image };
        return part;
      });
      if (content.length === 1 && content[0]?.type === "text") {
        content = content[0].text;
      }
    }
    if (m.role === "user") return new HumanMessage({ content, additional_kwargs: {} });
    if (m.role === "system") return new SystemMessage({ content, additional_kwargs: {} });
    return new AIMessage({ content, additional_kwargs: {} });
  });

  console.log("[orchestrate] LangChain messages:", langchainMessages.length);

  // `mood` may be null/undefined (= auto-detect). Don't coerce to "friendly"
  // here — the buddyAgent does the user > detected > default resolution.
  const moodKey = (mood ?? null) as string | null;

  // ─── Fast-path detection ──────────────────────────────────────────
  const lastUserMsg = langchainMessages[langchainMessages.length - 1];
  const lastContent = lastUserMsg?.content as unknown;
  let lastText: string = "";
  let isMultimodal = false;
  if (typeof lastContent === "string") {
    lastText = lastContent;
  } else if (Array.isArray(lastContent)) {
    const parts = lastContent as Array<{ type?: string; text?: string }>;
    const textPart = parts.find((p) => p?.type === "text");
    lastText = textPart?.text ?? "";
    isMultimodal = parts.some((p) => p?.type === "image_url");
  }
  const useFastPath = isFastPathEligible(lastText, isMultimodal);
  if (useFastPath) {
    console.log("[orchestrate] ⚡ Fast-path:", JSON.stringify(lastText.slice(0, 40)));
  }

  // ─── Conversation auto-mint ────────────────────────────────────────
  // Required so downstream nodes (imageGenerationNode, persistenceNode)
  // can attach jobs / messages to a real Conversation document.
  // The minted ID is sent back to the client as a `conversation` SSE
  // event so subsequent turns reuse it.
  let resolvedConversationId: string | null = conversationId ?? null;
  let createdConversation = false;
  try {
    await connectToDb();
    if (!resolvedConversationId) {
      const title = lastText.slice(0, 60).trim() || "New conversation";
      const conv = await Conversation.create({ userId: token.id, title });
      resolvedConversationId = conv._id.toString();
      createdConversation = true;
      console.log("[orchestrate] Minted conversation:", resolvedConversationId);
    }
  } catch (err: any) {
    // Non-fatal: chat still works, but image-gen will fail clean later.
    console.error("[orchestrate] Conversation mint failed:", err?.message || err);
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const safeEnqueue = (chunk: Uint8Array) => {
        if (closed) return;
        try {
          controller.enqueue(chunk);
        } catch {
          /* controller may already be closed */
        }
      };
      const safeClose = () => {
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      const onAbort = () => {
        console.log("[orchestrate] Client aborted");
        safeEnqueue(sse({ type: "aborted" }));
        safeClose();
      };
      req.signal.addEventListener("abort", onAbort);

      type SseChunk = {
        type: string;
        content?: string;
        mode?: "fast" | "graph";
        id?: string;
      };
      const writer = (chunk: SseChunk) => {
        if (req.signal.aborted) return;
        safeEnqueue(sse(chunk));
      };

      let streamedAnyToken = false;
      const trackingWriter = (chunk: SseChunk) => {
        if (chunk.type === "token" && chunk.content) streamedAnyToken = true;
        writer(chunk);
      };

      try {
        // Tell the client we accepted the request — useful for "thinking…" UIs
        // that want a signal before the first token actually arrives.
        writer({ type: "start", mode: useFastPath ? "fast" : "graph" });

        // If the route minted a fresh Conversation, send the id back so the
        // client can persist it for the rest of the session.
        if (createdConversation && resolvedConversationId) {
          writer({ type: "conversation", id: resolvedConversationId });
        }

        // ─── FAST PATH ────────────────────────────────────────────
        // Skip safety/intent/sentiment/supervisor for short small-talk.
        // The greeting set is inherently safe + non-routable, so the
        // 5-LLM-call orchestration overhead is pure waste here.
        if (useFastPath) {
          await buddyAgent(
            {
              messages: langchainMessages,
              next: "buddy",
              mood: moodKey,
              detectedMood: null,
              premium: false,
              isSafe: true,
              intent: "casual_chat",
              finalResponse: false,
              conversationId: resolvedConversationId,
              userId: token.id as string,
            } as any,
            {
              configurable: {
                streamWriter: trackingWriter,
                abortSignal: req.signal,
              },
            }
          );

          if (req.signal.aborted) return;
          if (!streamedAnyToken) {
            const fallback = FALLBACK_REPLIES[moodKey ?? "friendly"] ?? FALLBACK_REPLIES.friendly;
            writer({ type: "token", content: fallback });
          }
          writer({ type: "done" });
          return;
        }

        // ─── FULL GRAPH ────────────────────────────────────────────
        const entitlement = await getEntitlement(token.id as string);
        console.log("[orchestrate] Entitlement:", entitlement.tier);

        const result = await agentGraph.invoke(
          {
            messages: langchainMessages,
            mood: moodKey,
            premium: entitlement.tier === "pro",
            finalResponse: false,
            userId: token.id as string,
            conversationId: resolvedConversationId,
          },
          {
            configurable: {
              sessionId: "session-" + token.id,
              thread_id: "thread-" + token.id,
              streamWriter: trackingWriter,
              abortSignal: req.signal,
            },
          }
        );

        if (req.signal.aborted) {
          // onAbort already drained + closed the stream.
          return;
        }

        // If buddyAgent never emitted a token (e.g. graph routed to a node
        // that hasn't been wired for streaming yet), fall back to whatever
        // sits on the last AIMessage.
        if (!streamedAnyToken) {
          const last = result.messages?.[result.messages.length - 1];
          const text =
            last?.content?.toString() ||
            FALLBACK_REPLIES[moodKey ?? "friendly"] ||
            FALLBACK_REPLIES.friendly;
          console.log("[orchestrate] No tokens streamed, flushing final:", text.slice(0, 50));
          writer({ type: "token", content: text });
        }

        writer({ type: "done" });
      } catch (err: any) {
        if (req.signal.aborted || err?.name === "AbortError") {
          // Already handled by onAbort.
          return;
        }
        console.error("[orchestrate] Graph error:", err?.message || err);

        if (!streamedAnyToken) {
          const fallback = FALLBACK_REPLIES[moodKey ?? "friendly"] || FALLBACK_REPLIES.friendly;
          writer({ type: "token", content: fallback });
        }
        writer({ type: "error", content: err?.message || "Graph failed" });
        writer({ type: "done" });
      } finally {
        req.signal.removeEventListener("abort", onAbort);
        safeClose();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // Disables buffering on Vercel / nginx so tokens flush immediately.
      "X-Accel-Buffering": "no",
    },
  });
}
