import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { AIMessage, BaseMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { Types } from "mongoose";

import { generateSchema } from "@/lib/schemas";
import { connectToDb } from "@/lib/db";
import { Conversation, Message } from "@/models/Conversation";
import { MediaJob } from "@/models/MediaJob";
import { UserPreferences } from "@/models/UserPreferences";
import { detectIntent, stripImagePrefix } from "@/lib/chat/intentRouter";
import { streamChat } from "@/lib/chat/streamChat";
import { generateImage, ImageGenerationError } from "@/lib/chat/generateImage";
import { errMessage, isAbort } from "@/lib/errors";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/orchestrate
 *
 * Single entry point for both chat and image-generation requests.
 *
 *   intent = "chat"   → streamChat (1 LLM call, tokens streamed via SSE)
 *   intent = "image"  → generateImage (Cloudflare → Cloudinary, sync)
 *
 * Both paths complete inside a single SSE response — no background workers,
 * no queues, no client-side polling. Image generation is sync because
 * Cloudflare Workers AI returns the image inline (~3-5s + ~1-2s upload).
 *
 * SSE event protocol:
 *   { type: "start", mode: "chat" | "image" }
 *   { type: "conversation", id }                    (only when freshly minted)
 *   { type: "token", content }                      chat only
 *   { type: "image_progress", phase: "generating" | "uploading" }
 *   { type: "image_done", url, prompt }             final image URL
 *   { type: "image_failed", error }
 *   { type: "aborted" }                              user pressed Stop
 *   { type: "error", content }                       unexpected server error
 *   { type: "done" }                                 terminal frame
 */

const FALLBACK_REPLY =
  "I'm having trouble responding right now — try sending that again in a moment.";

const encoder = new TextEncoder();
const sse = (data: unknown) => encoder.encode(`data: ${JSON.stringify(data)}\n\n`);

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// ─── Wire types for incoming request body ────────────────────────────────────

type RawTextPart = { type: "text"; text?: string };
type RawImagePart = { type: "image"; image?: unknown };
type RawPart = RawTextPart | RawImagePart | { type: string;[k: string]: unknown };
type RawMessage = {
  role?: "user" | "assistant" | "system";
  content?: unknown;
  parts?: RawPart[];
};

// ─── Pure helpers (no side effects) ──────────────────────────────────────────

function sanitizeString(s: string): string {
  return s
    .replace(/<script\b[^<]*(?:(?!<script)<[^<]*)*<\/script>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .replace(/eval\s*\(/gi, "");
}

function sanitizeContent(content: unknown): unknown {
  if (typeof content === "string") return sanitizeString(content);
  if (Array.isArray(content)) {
    return content.map((part) => {
      if (
        part &&
        typeof part === "object" &&
        (part as { type?: unknown }).type === "text" &&
        typeof (part as { text?: unknown }).text === "string"
      ) {
        return { ...(part as object), text: sanitizeString((part as { text: string }).text) };
      }
      return part;
    });
  }
  return content;
}

function toLangChainMessages(rawMessages: RawMessage[]): BaseMessage[] {
  return rawMessages.map((m) => {
    let content: unknown = sanitizeContent(m.content);

    if (!content && Array.isArray(m.parts)) {
      const arr = m.parts.map((part) => {
        if (part.type === "text") {
          const t = (part as RawTextPart).text ?? "";
          return { type: "text", text: typeof t === "string" ? sanitizeString(t) : "" };
        }
        if (part.type === "image") {
          return { type: "image_url", image_url: (part as RawImagePart).image };
        }
        return part;
      });
      content =
        arr.length === 1 && (arr[0] as { type?: string }).type === "text"
          ? (arr[0] as { text: string }).text
          : arr;
    }

    if (m.role === "user") return new HumanMessage({ content: content as string });
    if (m.role === "system") return new SystemMessage({ content: content as string });
    return new AIMessage({ content: content as string });
  });
}

function extractLatestText(messages: BaseMessage[]): string {
  const last = messages[messages.length - 1];
  const content = last?.content as unknown;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    const textPart = content.find(
      (p): p is { type: "text"; text: string } =>
        !!p && typeof p === "object" && (p as { type?: unknown }).type === "text"
    );
    return textPart?.text ?? "";
  }
  return "";
}

function countryFromLocale(locale: string | undefined): string {
  const part = locale?.split("-")[1]?.toUpperCase();
  return part && part.length === 2 ? part : "US";
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Trace IDs + timing for the whole request. Each log line carries the
  // request id + an "elapsed since start" so it's easy to spot which
  // phase is slow under load.
  const reqId = Math.random().toString(36).slice(2, 8);
  const t0 = Date.now();
  const ms = () => `${Date.now() - t0}ms`;
  const log = (...args: unknown[]) => console.log(`[orch:${reqId}]`, ms(), ...args);

  log("POST /api/orchestrate");

  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (!token?.id) {
    log("auth FAIL — no token");
    return jsonError("Unauthorized", 401);
  }
  log(`auth OK userId=${token.id}`);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    log("parse FAIL — invalid JSON");
    return jsonError("Invalid JSON", 400);
  }

  const parsed = generateSchema.safeParse(body);
  if (!parsed.success) {
    log("schema FAIL", parsed.error.issues[0]?.message);
    return jsonError(`Invalid: ${parsed.error.issues[0]?.message}`, 400);
  }
  const { messages: rawMessages, mood, conversationId } = parsed.data;
  const userId = token.id as string;
  const moodKey = mood ?? null;

  const messages = toLangChainMessages(rawMessages);
  const latestText = extractLatestText(messages);
  const intent = detectIntent(latestText);
  log(`intent=${intent} mood=${moodKey ?? "auto"} text="${latestText.slice(0, 60)}"`);

  // ─── Conversation: load existing or auto-mint ──────────────────────────────
  let resolvedConversationId: string | null = conversationId ?? null;
  let createdConversation = false;
  try {
    await connectToDb();
    log("db connected");
    if (!resolvedConversationId) {
      const title = latestText.slice(0, 60).trim() || "New conversation";
      const conv = await Conversation.create({ userId, title });
      resolvedConversationId = conv._id.toString();
      createdConversation = true;
      log(`conversation minted ${resolvedConversationId}`);
    } else {
      log(`conversation reused ${resolvedConversationId}`);
    }
  } catch (err) {
    log("conversation FAIL —", errMessage(err));
  }

  // Save user message to history + bump conversation's updatedAt so the
  // sidebar's "recent" sort reflects the latest activity. Both writes are
  // best-effort and non-blocking — chat shouldn't stall on a slow DB.
  if (resolvedConversationId && latestText) {
    const convObjectId = new Types.ObjectId(resolvedConversationId);
    Message.create({
      conversationId: convObjectId,
      role: "user",
      content: latestText,
      parts: [{ type: "text", text: latestText }],
    })
      .then(() => log("user msg saved"))
      .catch((e) => log("user msg save FAIL —", errMessage(e)));
    Conversation.updateOne(
      { _id: convObjectId },
      { $currentDate: { updatedAt: true } }
    ).catch((e) => log("conv touch FAIL —", errMessage(e)));
  }

  // ─── SSE Stream ────────────────────────────────────────────────────────────
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const safeEnqueue = (chunk: Uint8Array) => {
        if (closed) return;
        try {
          controller.enqueue(chunk);
        } catch { /* controller may already be closed */ }
      };
      const safeClose = () => {
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch { /* already closed */ }
      };

      const onAbort = () => {
        safeEnqueue(sse({ type: "aborted" }));
        safeClose();
      };
      req.signal.addEventListener("abort", onAbort);

      type SseChunk = {
        type: string;
        content?: string;
        mode?: "chat" | "image";
        id?: string;
        url?: string;
        prompt?: string;
        phase?: "generating" | "uploading";
        error?: string;
      };
      const writer = (chunk: SseChunk) => {
        if (req.signal.aborted) return;
        safeEnqueue(sse(chunk));
      };

      try {
        log("sse start");
        writer({ type: "start", mode: intent });
        if (createdConversation && resolvedConversationId) {
          writer({ type: "conversation", id: resolvedConversationId });
        }

        if (intent === "image") {
          log("→ image branch");
          await handleImageRequest({
            userId,
            conversationId: resolvedConversationId,
            prompt: stripImagePrefix(latestText),
            writer,
            signal: req.signal,
          });
          writer({ type: "done" });
          log(`image done — total ${ms()}`);
          return;
        }

        // ─── Chat path: direct LLM stream ─────────────────────────────
        log("→ chat branch (calling streamChat)");
        let acc = "";
        try {
          acc = await streamChat({
            messages,
            mood: moodKey,
            signal: req.signal,
            writer,
          });
        } catch (err) {
          if (req.signal.aborted || isAbort(err)) {
            log("aborted by client");
            return;
          }
          throw err;
        }

        if (req.signal.aborted) return;
        log(`chat reply ready chars=${acc.length}`);

        if (resolvedConversationId && acc) {
          const convObjectId = new Types.ObjectId(resolvedConversationId);
          Message.create({
            conversationId: convObjectId,
            role: "assistant",
            content: acc,
            parts: [{ type: "text", text: acc }],
          })
            .then(() => log("assistant msg saved"))
            .catch((e) => log("assistant msg save FAIL —", errMessage(e)));
          Conversation.updateOne(
            { _id: convObjectId },
            { $currentDate: { updatedAt: true } }
          ).catch((e) => log("conv touch FAIL —", errMessage(e)));
        }

        writer({ type: "done" });
        log(`chat done — total ${ms()}`);
      } catch (err) {
        if (req.signal.aborted || isAbort(err)) return;
        const message = errMessage(err);
        log("handler ERROR —", message);
        writer({ type: "error", content: message || "Server error" });
        writer({ type: "token", content: FALLBACK_REPLY });
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
      "X-Accel-Buffering": "no",
    },
  });
}

// ─── Image-path helper ───────────────────────────────────────────────────────

/**
 * End-to-end image generation:
 *   validate → MediaJob(running) → Cloudflare → Cloudinary → MediaJob(succeeded)
 *
 * Each phase emits an SSE progress event so the client can show meaningful
 * status text instead of a generic spinner.
 */
async function handleImageRequest(args: {
  userId: string;
  conversationId: string | null;
  prompt: string;
  signal: AbortSignal;
  writer: (chunk: {
    type: string;
    url?: string;
    prompt?: string;
    phase?: "generating" | "uploading";
    error?: string;
  }) => void;
}) {
  const { userId, conversationId, prompt, signal, writer } = args;

  if (!prompt) {
    writer({
      type: "image_failed",
      error: "Tell me what to draw — e.g. `/image a calico cat in space`.",
    });
    return;
  }
  if (!conversationId) {
    writer({
      type: "image_failed",
      error: "Couldn't attach the image to a conversation. Refresh and retry.",
    });
    return;
  }

  // Country from prefs satisfies MediaJob's required locale.country field.
  const prefs = await UserPreferences.findOne({ userId })
    .lean<{ locale?: string }>()
    .catch(() => null);
  const country = countryFromLocale(prefs?.locale);

  let job: { _id: { toString(): string } };
  try {
    job = await MediaJob.create({
      userId,
      conversationId,
      kind: "image",
      prompt,
      modelId: "@cf/black-forest-labs/flux-1-schnell",
      status: "running",
      locale: { country },
    });
  } catch (err) {
    console.error("[orchestrate:image] MediaJob.create failed:", errMessage(err));
    writer({ type: "image_failed", error: "Could not record the image job. Try again." });
    return;
  }

  writer({ type: "image_progress", phase: "generating" });

  try {
    const result = await generateImage(prompt);
    if (signal.aborted) return;

    writer({ type: "image_progress", phase: "uploading" });
    // (Cloudinary upload already happened inside generateImage. The
    // separate progress event is purely for nicer client-side phasing —
    // the actual work is done. Kept lightweight on purpose.)

    await MediaJob.findByIdAndUpdate(job._id, {
      status: "succeeded",
      resultUrl: result.url,
      finishedAt: new Date(),
    });

    // Persist the assistant message with the image part so it shows up
    // in conversation history on reload, and touch the conversation's
    // updatedAt so the sidebar's recent-activity sort stays correct.
    const convObjectId = new Types.ObjectId(conversationId);
    Message.create({
      conversationId: convObjectId,
      role: "assistant",
      content: `Here's your image — ${prompt}`,
      parts: [
        { type: "text", text: `Here's your image — ${prompt}` },
        { type: "image", mediaJobId: new Types.ObjectId(job._id.toString()), url: result.url },
      ],
    }).catch((e) =>
      console.error("[orchestrate:image] save msg failed:", errMessage(e))
    );
    Conversation.updateOne(
      { _id: convObjectId },
      { $currentDate: { updatedAt: true } }
    ).catch((e) => console.error("[orchestrate:image] conv touch failed:", errMessage(e)));

    writer({ type: "image_done", url: result.url, prompt });
  } catch (err) {
    const code = err instanceof ImageGenerationError ? err.code : "unknown";
    const message = errMessage(err);
    console.error("[orchestrate:image] failed:", code, message);

    await MediaJob.findByIdAndUpdate(job._id, {
      status: "failed",
      error: { code, message },
      finishedAt: new Date(),
    }).catch(() => {});

    const userFacing =
      code === "config_missing"
        ? "Image generation isn't configured on the server."
        : code === "provider_timeout"
          ? "The image generator took too long. Try a simpler prompt."
          : code === "upload_failed"
            ? "Couldn't save your image. Try again in a moment."
            : "Image generation failed. Try again.";

    writer({ type: "image_failed", error: userFacing });
  }
}
