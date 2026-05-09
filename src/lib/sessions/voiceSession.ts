import { getRedis } from "@/lib/redis/client";

/**
 * Voice session state cache.
 *
 * Mirrors the ephemeral context of a user's current voice/chat session so
 * a reconnect (mobile network switch, refresh, second tab) can pick up
 * the same persona, conversation, and last-known mood instantly without
 * waiting on Mongo aggregations.
 *
 * Source of truth still lives in:
 *   - persona     → user.preferences.buddyPersona (Mongo)
 *   - locale      → user.locale (Mongo)
 *   - conversationId → URL + Conversation collection (Mongo)
 *   - expression  → MediaPipe (client only, never persisted)
 *
 * Redis is just the warm cache. Missing keys are NOT errors — caller
 * falls back to the source of truth. TTL is 30 minutes — long enough for
 * a phone-network blip, short enough that stale state doesn't linger.
 */

const TTL_SECONDS = 30 * 60;

export interface VoiceSession {
  conversationId: string | null;
  persona: string | null;
  locale: string | null;
  expression: string | null;
  /** ms-precision unix epoch of the last orchestrate turn. */
  lastUtteranceAt: number;
}

function key(userId: string): string {
  return `voicesess:${userId}`;
}

/**
 * Load the cached voice session. Returns null if Redis is not configured
 * or the user has no entry yet.
 */
export async function getVoiceSession(userId: string): Promise<VoiceSession | null> {
  const r = getRedis();
  if (!r) return null;
  try {
    // Upstash returns the value already deserialised when we use hash ops,
    // but for whole-object reads we use get with a stringified payload to
    // keep the contract simple.
    const raw = await r.get<VoiceSession>(key(userId));
    return raw ?? null;
  } catch (err) {
    console.warn("[voiceSession] load failed:", err);
    return null;
  }
}

/**
 * Merge `partial` into the cached session and reset the TTL.
 * Fire-and-forget — callers don't await this on the hot path.
 */
export async function saveVoiceSession(
  userId: string,
  partial: Partial<VoiceSession>
): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    const existing = (await r.get<VoiceSession>(key(userId))) ?? {
      conversationId: null,
      persona: null,
      locale: null,
      expression: null,
      lastUtteranceAt: 0,
    };
    const merged: VoiceSession = {
      ...existing,
      ...partial,
      lastUtteranceAt: partial.lastUtteranceAt ?? Date.now(),
    };
    await r.set(key(userId), merged, { ex: TTL_SECONDS });
  } catch (err) {
    console.warn("[voiceSession] save failed:", err);
  }
}

/**
 * Reset just the TTL without changing the value — useful for "user is
 * still active" pings.
 */
export async function touchVoiceSession(userId: string): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    await r.expire(key(userId), TTL_SECONDS);
  } catch (err) {
    console.warn("[voiceSession] touch failed:", err);
  }
}

export async function clearVoiceSession(userId: string): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    await r.del(key(userId));
  } catch (err) {
    console.warn("[voiceSession] clear failed:", err);
  }
}
