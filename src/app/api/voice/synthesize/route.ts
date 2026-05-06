import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { getEntitlement } from "@/lib/entitlement";
import { synthesizeSpeech, CloudflareVoiceError } from "@/lib/voice/cloudflareSpeech";
import { errMessage } from "@/lib/errors";

export const runtime = "nodejs";

const MAX_TEXT_LENGTH = 1500;

const ttsSchema = z.object({
  text: z.string().min(1).max(MAX_TEXT_LENGTH),
  lang: z.enum(["en", "es", "fr", "zh", "jp", "kr"]).optional(),
});

/**
 * POST /api/voice/synthesize
 *
 * Generates speech audio from text using Cloudflare MeloTTS and streams
 * the resulting MP3 back to the client. Used by /live_talk to speak the
 * AI's reply, sentence by sentence.
 *
 * Request:
 *   { text: string, lang?: "en" | "es" | "fr" | "zh" | "jp" | "kr" }
 * Response:
 *   audio/mpeg (binary MP3) — pipe straight into <audio> or new Audio()
 */
export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (!token?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const entitlement = await getEntitlement(token.id as string);
  if (!entitlement.features.voiceConversational) {
    return NextResponse.json(
      { error: "Voice features require Premium tier." },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = ttsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );
  }

  try {
    const audio = await synthesizeSpeech(parsed.data.text, parsed.data.lang ?? "en");
    return new Response(new Uint8Array(audio), {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audio.length.toString(),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const code = err instanceof CloudflareVoiceError ? err.code : "unknown";
    console.error("[voice:synthesize] failed:", code, errMessage(err));
    const status =
      code === "config_missing" ? 503 :
      code === "provider_timeout" ? 504 :
      500;
    return NextResponse.json(
      { error: "Speech synthesis failed.", code },
      { status }
    );
  }
}
