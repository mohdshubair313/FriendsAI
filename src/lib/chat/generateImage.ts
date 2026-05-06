import { uploadImageBuffer } from "@/lib/cloudinary";
import { errMessage } from "@/lib/errors";

/**
 * Image Generation Pipeline (sync, no queue).
 *
 *   prompt
 *     │
 *     ├─▶ Cloudflare Workers AI (flux-1-schnell)  ~3-5s
 *     │       returns: { image: "<base64 jpeg>" }
 *     │
 *     ├─▶ Decode base64 → Buffer
 *     │
 *     └─▶ Cloudinary upload                        ~1-2s
 *             returns: { url: "https://res.cloudinary.com/..." }
 *
 * Total wall-time: ~5-8s. Fits inside Vercel's 10s Hobby function limit
 * with a comfortable margin. No background worker, no queue, no polling.
 *
 * This replaces the entire BullMQ + worker.ts + LangGraph image pipeline
 * we had before. The async/queue pattern was only needed because the
 * previous provider (Pollinations) had no proper API — Cloudflare gives
 * us a real REST endpoint that returns the image inline, so we can do
 * the whole thing in a single request handler.
 */

const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CF_MODEL = "@cf/black-forest-labs/flux-1-schnell";

const GENERATION_TIMEOUT_MS = 25_000; // hard ceiling so a stuck CF call can't pin the route

export interface GenerateImageResult {
  url: string;        // hosted Cloudinary URL — store this in MediaJob
  publicId: string;   // for future delete operations
  width: number;
  height: number;
  bytes: number;
}

/**
 * Custom error class so callers can distinguish "provider failed" (retry
 * makes sense) from "invalid prompt" (don't retry).
 */
export class ImageGenerationError extends Error {
  constructor(
    message: string,
    public code:
      | "config_missing"
      | "provider_timeout"
      | "provider_failed"
      | "decode_failed"
      | "upload_failed"
  ) {
    super(message);
    this.name = "ImageGenerationError";
  }
}

/**
 * Generate one image from a text prompt.
 *
 * Throws `ImageGenerationError` on failure with a code the caller can
 * use to pick the right error message for the user.
 */
export async function generateImage(prompt: string): Promise<GenerateImageResult> {
  if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
    throw new ImageGenerationError(
      "Cloudflare Workers AI not configured (set CLOUDFLARE_ACCOUNT_ID + CLOUDFLARE_API_TOKEN)",
      "config_missing"
    );
  }

  // ── Step 1: ask Cloudflare to generate the image ──────────────────────
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/${CF_MODEL}`;
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), GENERATION_TIMEOUT_MS);

  let cfJson: { result?: { image?: string }; success?: boolean; errors?: unknown[] };
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CF_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt, steps: 4 }),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new ImageGenerationError(
        `Cloudflare returned HTTP ${res.status}: ${body.slice(0, 200)}`,
        "provider_failed"
      );
    }
    cfJson = await res.json();
  } catch (err) {
    if ((err as { name?: string }).name === "AbortError") {
      throw new ImageGenerationError("Cloudflare request timed out", "provider_timeout");
    }
    if (err instanceof ImageGenerationError) throw err;
    throw new ImageGenerationError(`Cloudflare fetch failed: ${errMessage(err)}`, "provider_failed");
  } finally {
    clearTimeout(timeout);
  }

  const base64 = cfJson?.result?.image;
  if (!base64) {
    throw new ImageGenerationError(
      `Cloudflare returned no image (success=${cfJson?.success})`,
      "provider_failed"
    );
  }

  // ── Step 2: decode base64 → Buffer ────────────────────────────────────
  let buffer: Buffer;
  try {
    buffer = Buffer.from(base64, "base64");
    if (buffer.length < 1024) {
      // Defensive: a real JPEG from Flux is hundreds of KB. If we got
      // <1KB the response was probably malformed.
      throw new Error(`buffer too small (${buffer.length} bytes)`);
    }
  } catch (err) {
    throw new ImageGenerationError(`Could not decode image: ${errMessage(err)}`, "decode_failed");
  }

  // ── Step 3: upload to Cloudinary ──────────────────────────────────────
  try {
    const result = await uploadImageBuffer(buffer);
    return result;
  } catch (err) {
    throw new ImageGenerationError(`Cloudinary upload failed: ${errMessage(err)}`, "upload_failed");
  }
}
