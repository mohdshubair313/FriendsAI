import { Redis } from "@upstash/redis";

/**
 * Singleton Upstash Redis client.
 *
 * Lazy-init: nothing happens until something asks for the client. Returns
 * `null` if env isn't configured — every caller is expected to handle that
 * gracefully (Redis is opt-in; the app works fine without it).
 *
 * Why Upstash REST and not ioredis: works in the Edge runtime, no
 * connection pool to manage, and Upstash is what the project is already
 * paying for (per .env).
 */

let cached: Redis | null = null;
let initialized = false;

export function getRedis(): Redis | null {
  if (initialized) return cached;
  initialized = true;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    console.log("[redis] not configured — session caching disabled");
    return null;
  }
  cached = new Redis({ url, token });
  return cached;
}

/** Cheap "is Redis available right now" check for callers that want to branch. */
export function isRedisConfigured(): boolean {
  return !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;
}
