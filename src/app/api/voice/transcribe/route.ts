import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getEntitlement } from "@/lib/entitlement";
import { transcribeAudio, CloudflareVoiceError } from "@/lib/voice/cloudflareSpeech";
import { proxyTranscribe, isProxyConfigured } from "@/lib/voice/proxyClient";
import { sttLangFor } from "@/lib/locale/catalog";
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
  // Full BCP-47 (e.g. "hi-IN"). Voice-service router uses this to pick
  // Sarvam vs Cloudflare. Direct-Cloudflare fallback path converts to
  // Whisper's 2-letter form via sttLangFor().
  let language = "en-US";
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

    const lang = formData.get("language");
    if (typeof lang === "string" && lang.length >= 2) {
      language = lang;
    }
  } catch (err) {
    return NextResponse.json(
      { error: `Could not read audio: ${errMessage(err)}` },
      { status: 400 }
    );
  }

  // Proxy-first when configured; null return signals "fall back to direct".
  if (isProxyConfigured()) {
    const t0 = Date.now();
    const proxied = await proxyTranscribe(audioBuffer, language, {
      userId: token.id as string,
      tier: entitlement.tier,
    });
    if (proxied !== null) {
      const ms = Date.now() - t0;
      console.log(`[voice:transcribe] proxied chars=${proxied.length} dur=${ms}ms`);
      return NextResponse.json(
        { text: proxied },
        { headers: { "Server-Timing": `stt;dur=${ms};desc="proxy"` } }
      );
    }
    console.warn("[voice:transcribe] proxy unavailable — falling back to direct Cloudflare");
  }

  try {
    // Direct-CF fallback: Whisper wants the 2-letter code, not BCP-47.
    const t0 = Date.now();
    const text = await transcribeAudio(audioBuffer, sttLangFor(language));
    const ms = Date.now() - t0;
    return NextResponse.json(
      { text },
      { headers: { "Server-Timing": `stt;dur=${ms};desc="cloudflare-direct"` } }
    );
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
