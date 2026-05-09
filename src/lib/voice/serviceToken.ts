import { SignJWT } from "jose";

/**
 * Mints short-lived service tokens for the FastAPI voice-service.
 *
 * The Next.js process is the only authority that knows who the user is —
 * the FastAPI process trusts our HS256 signature using a shared secret.
 * Tokens live 5 minutes (more than enough for a single voice request).
 *
 * Match: app/auth.py in voice-service/ verifies with the same secret +
 * issuer.
 */

const ISSUER = "friendsai-next";
const TOKEN_TTL_SECONDS = 5 * 60;

let cachedKey: Uint8Array | null = null;

function getKey(): Uint8Array | null {
  if (cachedKey) return cachedKey;
  const secret = process.env.VOICE_SERVICE_JWT_SECRET;
  if (!secret) return null;
  cachedKey = new TextEncoder().encode(secret);
  return cachedKey;
}

export interface ServiceTokenClaims {
  userId: string;
  tier?: string;
  /** BCP-47, e.g. "hi-IN" — informs FastAPI which provider/voice to use. */
  locale?: string | null;
}

/**
 * Returns null if VOICE_SERVICE_JWT_SECRET is not configured (caller should
 * fall back to direct Cloudflare). Throws only if signing itself fails.
 */
export async function mintServiceToken(claims: ServiceTokenClaims): Promise<string | null> {
  const key = getKey();
  if (!key) return null;

  return await new SignJWT({
    tier: claims.tier ?? "free",
    locale: claims.locale ?? null,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.userId)
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_TTL_SECONDS}s`)
    .sign(key);
}
