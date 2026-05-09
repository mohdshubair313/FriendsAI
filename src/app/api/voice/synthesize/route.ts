import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { getEntitlement } from "@/lib/entitlement";
import { synthesizeSpeech, CloudflareVoiceError } from "@/lib/voice/cloudflareSpeech";
import { proxySynthesize, isProxyConfigured } from "@/lib/voice/proxyClient";
import { ttsLangFor } from "@/lib/locale/catalog";
import { errMessage } from "@/lib/errors";

export const runtime = "nodejs";

const MAX_TEXT_LENGTH = 1500;

// `lang` accepts BCP-47 ("hi-IN") OR the legacy MeloTTS literal ("en").
// Voice-service router maps BCP-47 to provider-specific codes; for the
// direct-Cloudflare fallback we map via ttsLangFor() below.
const ttsSchema = z.object({
  text: z.string().min(1).max(MAX_TEXT_LENGTH),
  lang: z.string().min(2).max(10).optional(),
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

  // Proxy-first when configured; null return signals "fall back to direct".
  if (isProxyConfigured()) {
    const proxied = await proxySynthesize(parsed.data.text, requestedLang, {
      userId: token.id as string,
      tier: entitlement.tier,
    });
    if (proxied !== null) {
      console.log(`[voice:synthesize] proxied bytes=${proxied.length}`);
      return new Response(new Uint8Array(proxied), {
        status: 200,
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Length": proxied.length.toString(),
          "Cache-Control": "no-store",
        },
      });
    }
    console.warn("[voice:synthesize] proxy unavailable — falling back to direct Cloudflare");
  }

  try {
    // Direct CF fallback: MeloTTS only speaks en/es/fr/zh/jp/kr — Indian
    // langs degrade to English voice automatically via ttsLangFor().
    const audio = await synthesizeSpeech(parsed.data.text, ttsLangFor(requestedLang));
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
