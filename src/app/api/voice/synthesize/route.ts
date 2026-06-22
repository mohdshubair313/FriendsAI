import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { getEntitlement } from "@/lib/entitlement";
import { synthesizeSpeech, CloudflareVoiceError } from "@/lib/voice/cloudflareSpeech";
import { proxySynthesize, isProxyConfigured } from "@/lib/voice/proxyClient";
import { ttsLangFor } from "@/lib/locale/catalog";
import { resolveSarvamSpeaker, type VoiceStyleId } from "@/lib/voices/catalog";
import { PERSONAS } from "@/lib/chat/personas";
import type { BuddyPersona } from "@/models/userModel";
import { errMessage } from "@/lib/errors";

export const runtime = "nodejs";

const MAX_TEXT_LENGTH = 1500;

// `lang` accepts BCP-47 ("hi-IN") OR the legacy MeloTTS literal ("en").
// Voice-service router maps BCP-47 to provider-specific codes; for the
// direct-Cloudflare fallback we map via ttsLangFor() below.
const ttsSchema = z.object({
  text: z.string().min(1).max(MAX_TEXT_LENGTH),
  lang: z.string().min(2).max(10).optional(),
  // User's chosen voice style (from onboarding step 3). We resolve here
  // because the catalog lives in TS — no point duplicating that map in
  // Python. Server hands the resolved Sarvam speaker to FastAPI.
  voiceStyle: z
    .enum(["warm_female", "confident_male", "bright_playful", "calm_senior"])
    .optional(),
  // Active persona (from the meet selector). When voiceStyle is NOT
  // explicitly provided, the persona's preferred voiceStyle (from
  // personas.ts) is used as a fallback, so the TTS voice matches the
  // character the user is talking to.
  persona: z
    .enum(["friendly", "humorous", "philosophical", "romantic", "motivational", "doctor", "musician", "comedian", "senior_dev"])
    .optional(),
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

  const requestedLang = parsed.data.lang ?? "en-US";
  // Persona → voiceStyle resolution: if the caller didn't explicitly provide
  // a voiceStyle but DID provide a persona, use the persona's preferred style.
  // This ensures the TTS voice matches the character (Doctor→calm_senior,
  // Comedian→bright_playful, etc.) without the client needing to manage both.
  let effectiveStyle: VoiceStyleId | undefined = parsed.data.voiceStyle as VoiceStyleId | undefined;
  if (!effectiveStyle && parsed.data.persona) {
    const card = PERSONAS[parsed.data.persona as BuddyPersona];
    if (card?.voiceStyle) {
      effectiveStyle = card.voiceStyle;
    }
  }
  // Resolve voice style → Sarvam speaker name using our TS catalog. null
  // when there's no matching (language, style) pair — Sarvam falls back
  // to its per-language default.
  const speaker = resolveSarvamSpeaker(
    requestedLang,
    effectiveStyle
  );

  // Proxy-first when configured; null return signals "fall back to direct".
  if (isProxyConfigured()) {
    const t0 = Date.now();
    const proxied = await proxySynthesize(
      parsed.data.text,
      requestedLang,
      {
        userId: token.id as string,
        tier: entitlement.tier,
      },
      speaker
    );
    if (proxied !== null) {
      const ms = Date.now() - t0;
      console.log(`[voice:synthesize] proxied bytes=${proxied.length} dur=${ms}ms`);
      return new Response(new Uint8Array(proxied), {
        status: 200,
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Length": proxied.length.toString(),
          "Cache-Control": "no-store",
          "Server-Timing": `tts;dur=${ms};desc="proxy"`,
        },
      });
    }
    console.warn("[voice:synthesize] proxy unavailable — falling back to direct Cloudflare");
  }

  try {
    // Direct CF fallback: MeloTTS only speaks en/es/fr/zh/jp/kr — Indian
    // langs degrade to English voice automatically via ttsLangFor().
    const t0 = Date.now();
    const audio = await synthesizeSpeech(parsed.data.text, ttsLangFor(requestedLang));
    const ms = Date.now() - t0;
    return new Response(new Uint8Array(audio), {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audio.length.toString(),
        "Cache-Control": "no-store",
        "Server-Timing": `tts;dur=${ms};desc="cloudflare-direct"`,
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
