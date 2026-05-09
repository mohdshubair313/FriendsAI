import { mintServiceToken, type ServiceTokenClaims } from "./serviceToken";

/**
 * Proxy client for the Python voice-service.
 *
 * Both helpers return `null` to signal "service unavailable, please fall
 * back to the direct Cloudflare path". They never throw on transport
 * errors — that distinction is essential so the route handlers can
 * gracefully degrade.
 */

const HEALTH_CACHE_MS = 30_000; // re-probe at most every 30s
const REQUEST_TIMEOUT_MS = 30_000;

let healthCache: { ok: boolean; checkedAt: number } | null = null;

function baseUrl(): string | null {
  const url = process.env.VOICE_SERVICE_URL;
  if (!url) return null;
  return url.replace(/\/+$/, "");
}

/**
 * Cheap liveness check. Cached so we don't health-probe before every call.
 * If the service has been up in the last 30s we assume it's still up.
 */
async function isAlive(): Promise<boolean> {
  const url = baseUrl();
  if (!url) return false;
  const now = Date.now();
  if (healthCache && now - healthCache.checkedAt < HEALTH_CACHE_MS) {
    return healthCache.ok;
  }
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 1500);
    const res = await fetch(`${url}/v1/health`, { signal: ctrl.signal });
    clearTimeout(t);
    healthCache = { ok: res.ok, checkedAt: now };
    return res.ok;
  } catch {
    healthCache = { ok: false, checkedAt: now };
    return false;
  }
}

async function authHeader(claims: ServiceTokenClaims): Promise<HeadersInit | null> {
  const token = await mintServiceToken(claims);
  if (!token) return null;
  return { Authorization: `Bearer ${token}` };
}

/**
 * POST /v1/transcribe through the proxy.
 *
 * @returns the transcribed text, or null if proxy is unavailable / errored.
 */
export async function proxyTranscribe(
  audio: Buffer,
  language: string,
  claims: ServiceTokenClaims
): Promise<string | null> {
  const url = baseUrl();
  if (!url) return null;
  if (!(await isAlive())) return null;

  const auth = await authHeader(claims);
  if (!auth) return null;

  const form = new FormData();
  form.append(
    "audio",
    new Blob([new Uint8Array(audio)], { type: "audio/webm" }),
    "utterance.webm"
  );
  form.append("language", language);

  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
    const res = await fetch(`${url}/v1/transcribe`, {
      method: "POST",
      headers: auth,
      body: form,
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!res.ok) {
      console.warn(`[voice-proxy] transcribe upstream HTTP ${res.status}`);
      return null;
    }
    const json = (await res.json()) as { text?: string };
    return json.text ?? "";
  } catch (err) {
    console.warn("[voice-proxy] transcribe failed:", err);
    return null;
  }
}

/**
 * POST /v1/synthesize through the proxy.
 *
 * @returns the audio bytes, or null if proxy is unavailable / errored.
 */
export async function proxySynthesize(
  text: string,
  lang: string,
  claims: ServiceTokenClaims
): Promise<Buffer | null> {
  const url = baseUrl();
  if (!url) return null;
  if (!(await isAlive())) return null;

  const auth = await authHeader(claims);
  if (!auth) return null;

  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
    const res = await fetch(`${url}/v1/synthesize`, {
      method: "POST",
      headers: { ...auth, "Content-Type": "application/json" },
      body: JSON.stringify({ text, lang }),
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!res.ok) {
      console.warn(`[voice-proxy] synthesize upstream HTTP ${res.status}`);
      return null;
    }
    const arrayBuf = await res.arrayBuffer();
    return Buffer.from(arrayBuf);
  } catch (err) {
    console.warn("[voice-proxy] synthesize failed:", err);
    return null;
  }
}

export function isProxyConfigured(): boolean {
  return !!baseUrl() && !!process.env.VOICE_SERVICE_JWT_SECRET;
}
