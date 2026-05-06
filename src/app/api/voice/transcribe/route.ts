import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getEntitlement } from "@/lib/entitlement";
import { transcribeAudio, CloudflareVoiceError } from "@/lib/voice/cloudflareSpeech";
import { errMessage } from "@/lib/errors";

export const runtime = "nodejs";

/**
 * POST /api/voice/transcribe
 *
 * Accepts an audio file (multipart/form-data with field "audio") and
 * returns the transcribed text via Cloudflare Whisper Large v3 Turbo.
 *
 * Used by /live_talk for the speech-to-text leg of the voice pipeline.
 * Premium-only because voice features are a paid feature.
 *
 * Request:
 *   FormData: { audio: Blob (webm/mp3/wav/m4a) }
 * Response:
 *   { text: string }   — empty string is valid (no speech detected)
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

  let audioBuffer: Buffer;
  try {
    const formData = await req.formData();
    const file = formData.get("audio");
    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: "Missing 'audio' file" }, { status: 400 });
    }
    if (file.size === 0) {
      return NextResponse.json({ text: "" });
    }
    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: "Audio file too large (max 25 MB)" }, { status: 413 });
    }
    audioBuffer = Buffer.from(await file.arrayBuffer());
  } catch (err) {
    return NextResponse.json(
      { error: `Could not read audio: ${errMessage(err)}` },
      { status: 400 }
    );
  }

  try {
    const text = await transcribeAudio(audioBuffer);
    return NextResponse.json({ text });
  } catch (err) {
    const code = err instanceof CloudflareVoiceError ? err.code : "unknown";
    console.error("[voice:transcribe] failed:", code, errMessage(err));
    const status =
      code === "config_missing" ? 503 :
      code === "provider_timeout" ? 504 :
      500;
    return NextResponse.json(
      { error: "Transcription failed.", code },
      { status }
    );
  }
}
