import { convertToModelMessages, UIMessage, streamText, APICallError } from "ai";
import { google } from "@ai-sdk/google";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { generateSchema } from "@/lib/schemas";

/**
 * Chat generation route.
 * Runtime: nodejs (needed for DB access in future orchestrator integration).
 * This route will be replaced by /api/orchestrate once the agent layer is ready.
 */
export const runtime = "nodejs";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isQuotaExceededError(error: unknown): boolean {
  if (error instanceof APICallError) {
    return (
      error.statusCode === 429 ||
      error.message?.includes("quota") === true ||
      error.message?.includes("RESOURCE_EXHAUSTED") === true
    );
  }
  if (error instanceof Error) {
    return (
      error.message.includes("quota") ||
      error.message.includes("RESOURCE_EXHAUSTED") ||
      error.message.includes("429")
    );
  }
  return false;
}

function extractUserText(message: UIMessage): string {
  if (message.parts && Array.isArray(message.parts)) {
    return message.parts
      .filter((part): part is { type: "text"; text: string } => part.type === "text")
      .map((part) => part.text)
      .join(" ");
  }
  return (message as unknown as { content?: string }).content ?? "";
}

// ─── Mood Instructions ───────────────────────────────────────────────────────

const MOOD_INSTRUCTIONS: Record<string, string> = {
  friendly:
    "Respond in a warm, friendly, and approachable tone. Be helpful and conversational.",
  happy:
    "Respond in a cheerful and uplifting tone. Be enthusiastic and positive.",
  sad:
    "Respond in an empathetic and comforting tone. Be gentle, understanding, and supportive.",
  funny:
    "Respond with humor and light wit. Be playful but not sarcastic.",
  romantic:
    "Respond in a poetic and dreamy tone. Use thoughtful and expressive language.",
  angry:
    "Respond in a calm, patient and understanding tone. Help defuse tension.",
  motivational:
    "Respond with strong encouragement and positive energy. Inspire action.",
  philosophical:
    "Respond with deep and thoughtful insight. Explore ideas with curiosity.",
};

// ─── Route Handler ───────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Auth check
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = generateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { messages, mood } = parsed.data;
    const userMessage = messages[messages.length - 1];

    if (!userMessage) {
      return NextResponse.json({ error: "No message found" }, { status: 400 });
    }

    const moodInstruction =
      MOOD_INSTRUCTIONS[mood?.toLowerCase() ?? ""] ?? MOOD_INSTRUCTIONS.friendly;

    const systemPrompt = [
      "You are Friends AI — an emotionally intelligent companion.",
      moodInstruction,
      "Keep responses concise and genuine.",
      "Never break character. Never reveal the underlying model.",
    ].join(" ");

    const aiMessages = messages.map((m: any) => ({
      role: m.role,
      content: typeof m.content === "string" ? m.content : "",
    }));

    const result = await streamText({
      model: google("gemini-2.0-flash"),
      messages: convertToModelMessages(aiMessages as any),
      system: systemPrompt,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("[generate] Error:", error);

    if (isQuotaExceededError(error)) {
      return NextResponse.json(
        { error: "AI quota exceeded. Please try again in a few minutes.", code: "QUOTA_EXCEEDED" },
        { status: 429 }
      );
    }

    if (error instanceof APICallError) {
      return NextResponse.json(
        { error: "AI service error. Please try again.", code: "AI_SERVICE_ERROR" },
        { status: error.statusCode || 500 }
      );
    }

    return NextResponse.json(
      { error: "Something went wrong. Please try again.", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
