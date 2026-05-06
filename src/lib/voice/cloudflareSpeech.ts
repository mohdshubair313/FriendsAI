import { errMessage } from "@/lib/errors";

/**
 * Cloudflare Workers AI — Speech helpers.
 *
 * Two thin wrappers, both server-side only:
 *   transcribeAudio(buffer) → text   (Whisper Large v3 Turbo)
 *   synthesizeSpeech(text)  → mp3    (MeloTTS)
 *
 * Both share the same auth + endpoint shape, so the helper module also
 * owns the `cfRequest` primitive — anything else that wants to call a
 * Cloudflare AI model (image gen, vision) can build on it.
 *
 * Free-tier headroom (10,000 Neurons/day):
 *   Whisper Turbo: ~5 Neurons / minute of audio  → ~30 hours/day
 *   MeloTTS:       ~18 Neurons / minute of speech → ~9 hours/day
 *   Combined for live talk: comfortably enough for hundreds of voice users.
 */

const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

const WHISPER_MODEL = "@cf/openai/whisper-large-v3-turbo";
const MELOTTS_MODEL = "@cf/myshell-ai/melotts";

const STT_TIMEOUT_MS = 20_000;
const TTS_TIMEOUT_MS = 15_000;

export class CloudflareVoiceError extends Error {
  constructor(
    message: string,
    public code: "config_missing" | "provider_timeout" | "provider_failed" | "decode_failed"
  ) {
    super(message);
    this.name = "CloudflareVoiceError";
  }
}

function ensureConfigured() {
  if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
    throw new CloudflareVoiceError(
      "Cloudflare voice not configured (set CLOUDFLARE_ACCOUNT_ID + CLOUDFLARE_API_TOKEN)",
      "config_missing"
    );
  }
}

/**
 * Low-level POST to a Cloudflare Workers AI model.
 * Caller picks body shape (binary for STT, JSON for TTS).
 */
async function cfRequest(
  modelId: string,
  body: BodyInit,
  contentType: string,
  timeoutMs: number
): Promise<Response> {
  ensureConfigured();
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/${modelId}`;

  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CF_API_TOKEN}`,
        "Content-Type": contentType,
      },
      body,
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new CloudflareVoiceError(
        `Cloudflare ${modelId} returned HTTP ${res.status}: ${text.slice(0, 200)}`,
        "provider_failed"
      );
    }
    return res;
  } catch (err) {
    if ((err as { name?: string }).name === "AbortError") {
      throw new CloudflareVoiceError(`${modelId} timed out`, "provider_timeout");
    }
    if (err instanceof CloudflareVoiceError) throw err;
    throw new CloudflareVoiceError(`${modelId} fetch failed: ${errMessage(err)}`, "provider_failed");
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Speech-to-Text ─────────────────────────────────────────────────────────

/**
 * Transcribe an audio buffer (webm/mp3/wav/m4a) using Whisper.
 *
 * Cloudflare's Whisper endpoint accepts the raw audio bytes as the request
 * body. Response is JSON: { result: { text: "..." } }.
 *
 * @param buffer  raw audio bytes from MediaRecorder or upload
 * @returns trimmed transcript (may be empty string if audio had no speech)
 */
export async function transcribeAudio(buffer: Buffer): Promise<string> {
  const res = await cfRequest(WHISPER_MODEL, buffer, "application/octet-stream", STT_TIMEOUT_MS);
  let json: { result?: { text?: string } };
  try {
    json = await res.json();
  } catch (err) {
    throw new CloudflareVoiceError(`Whisper response not JSON: ${errMessage(err)}`, "decode_failed");
  }
  return (json?.result?.text ?? "").trim();
}

// ─── Text-to-Speech ─────────────────────────────────────────────────────────

const SUPPORTED_TTS_LANGS = new Set(["en", "es", "fr", "zh", "jp", "kr"]);

/**
 * Generate speech from text using MeloTTS.
 *
 * Cloudflare returns either base64 MP3 inside JSON or a binary stream
 * depending on the Accept header. We ask for binary to skip the base64
 * round-trip — it lands directly in our Response.
 *
 * @returns Buffer of MP3 audio bytes (caller decides how to deliver to client)
 */
export async function synthesizeSpeech(text: string, lang = "en"): Promise<Buffer> {
  const safeLang = SUPPORTED_TTS_LANGS.has(lang) ? lang : "en";
  const res = await cfRequest(
    MELOTTS_MODEL,
    JSON.stringify({ prompt: text, lang: safeLang }),
    "application/json",
    TTS_TIMEOUT_MS
  );

  // MeloTTS returns JSON with base64 audio under result.audio.
  // (Despite the docs hinting at binary mode, Cloudflare consistently
  //  returns JSON for this model right now.)
  let json: { result?: { audio?: string } };
  try {
    json = await res.json();
  } catch (err) {
    throw new CloudflareVoiceError(`MeloTTS response not JSON: ${errMessage(err)}`, "decode_failed");
  }
  const base64 = json?.result?.audio;
  if (!base64) {
    throw new CloudflareVoiceError("MeloTTS returned no audio payload", "provider_failed");
  }
  try {
    return Buffer.from(base64, "base64");
  } catch (err) {
    throw new CloudflareVoiceError(`MeloTTS base64 decode failed: ${errMessage(err)}`, "decode_failed");
  }
}
