import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";

import { generateSchema } from "@/lib/schemas";
import { agentGraph } from "@/agents";
import { getEntitlement } from "@/lib/entitlement";

export const runtime = "nodejs";

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

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (!token?.id) {
    console.log("[orchestrate] No token - unauthorized");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    console.log("[orchestrate] Body:", JSON.stringify(body).slice(0, 300));
    
    const parsed = generateSchema.safeParse(body);
    if (!parsed.success) {
      console.log("[orchestrate] Schema error:", parsed.error.issues);
      return NextResponse.json({ error: `Invalid: ${parsed.error.issues[0]?.message}` }, { status: 400 });
    }

    const { messages, mood, conversationId } = parsed.data;
    
    // Convert to LangChain messages
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
      const finalContent = typeof content === "string" ? content : content;
      if (m.role === "user") return new HumanMessage({ content: finalContent, additional_kwargs: {} });
      if (m.role === "system") return new SystemMessage({ content: finalContent, additional_kwargs: {} });
      return new AIMessage({ content: finalContent, additional_kwargs: {} });
    });

    console.log("[orchestrate] LangChain messages:", langchainMessages.length);

    let responseText = "";
    let useFallback = false;
    let fallbackReason = "";

    try {
      const entitlement = await getEntitlement(token.id as string);
      console.log("[orchestrate] Entitlement:", entitlement.tier);

      // Try the full LangGraph pipeline with proper config
      const result = await agentGraph.invoke(
        {
          messages: langchainMessages,
          mood: mood ?? "friendly",
          premium: entitlement.tier === "pro",
          finalResponse: false,
          userId: token.id as string,
          conversationId: conversationId ?? null,
        },
        { 
          configurable: { 
            sessionId: "session-" + token.id,
            thread_id: "thread-" + token.id,
          } 
        }
      );

      console.log("[orchestrate] Graph result messages:", result.messages?.length);
      
      const lastMessage = result.messages?.[result.messages?.length - 1];
      responseText = lastMessage?.content?.toString() || "";
      
      if (!responseText) {
        useFallback = true;
        fallbackReason = "Empty response from graph";
      }
    } catch (graphError: any) {
      console.error("[orchestrate] Graph error:", graphError?.message || graphError);
      useFallback = true;
      fallbackReason = graphError?.message || "Graph failed";
    }

    // If no response from graph, use fallback
    if (!responseText || useFallback) {
      console.log("[orchestrate] Using fallback response. Reason:", fallbackReason);
      const moodText = mood || "friendly";
      
      const fallbackResponses: Record<string, string> = {
        friendly: `Hi there! Thanks for reaching out. I'm here to chat, help, and connect with you. What's on your mind?`,
        happy: `Wow, it's great to hear from you! I'm so happy you're here! What would you like to talk about?`,
        sad: `Hey, I'm here for you. Even when things feel tough, remember you're not alone. Want to share what's going on?`,
        funny: `Haha, good to see you! 😄 You've got my full attention. What's funny today?`,
        motivational: `You've got this! 🚀 Every step forward counts. I'm here to support your journey. What's your goal?`,
        romantic: `💝 It's so wonderful to connect with you. Tell me what's in your heart...`,
        philosophical: `Interesting question... Let's explore this together. What are your thoughts?`,
        angry: `I hear you. Let's work through this together. What's troubling you?`
      };
      
      responseText = fallbackResponses[moodText] || fallbackResponses.friendly;
    }

    console.log("[orchestrate] Response:", responseText.slice(0, 50));

    return NextResponse.json({
      messages: [{ role: "assistant", content: responseText }]
    });

  } catch (error) {
    console.error("[orchestrate] Error:", error);
    return NextResponse.json({ error: "Failed", details: String(error) }, { status: 500 });
  }
}
