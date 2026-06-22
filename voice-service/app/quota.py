"""
Sliding-window quota tracker backed by Upstash Redis.

Why sliding window (and not "calendar-day buckets"):
  - Fairness: a user who burns through their quota at 11:55 PM doesn't get
    a free reset 5 minutes later. The 24-hour clock follows them, not the
    wall clock.
  - Abuse resilience: scripts hammering at midnight can't 2x their budget.

Storage model — one sorted set per (userId, resource):
  Key:    quota:<resource>:<userId>             e.g. quota:sarvam_tts:abc123
  Member: <uuid>                                 unique per call
  Score:  unix_ms_timestamp
  Side-channel: each member's *value* embeds the unit cost as "<units>:<uuid>"
                so a single ZRANGE returns enough to compute total usage.

Algorithm on every check + record:
  1. ZREMRANGEBYSCORE key 0 (now - 86400000)    drop entries older than 24h
  2. ZRANGE key 0 -1                            read remaining members
  3. parse + sum                                = current usage
  4. if usage + new_units <= limit:
       ZADD key <now> "<units>:<uuid>"           record the new usage
       return OK
     else:
       return 429 with reset_at = (oldest_member_score + 86400000)

Cost: ~3 round-trips per check (ZREMRANGEBYSCORE + ZRANGE + ZADD). Each is
sub-millisecond on Upstash REST. Good enough for our throughput.

Free-tier env handling: if UPSTASH_REDIS_REST_URL is not set, this module
no-ops (allow everything). We don't want a missing Redis to take the whole
voice pipeline down — quota is opt-in.
"""

from __future__ import annotations

import os
import time
import uuid
import logging
from dataclasses import dataclass
from typing import Optional

import httpx

log = logging.getLogger("quota")

WINDOW_MS = 24 * 60 * 60 * 1000  # 24h

# Lua script for atomic sliding-window quota check + record.
# Runs server-side on Redis so there's zero chance of a race between
# ZRANGE (read) and ZADD (write). Returns JSON-like array of integers.
_QUOTA_LUA_SCRIPT = """
local key = KEYS[1]
local now = tonumber(ARGV[1])
local cutoff = tonumber(ARGV[2])
local window_ms = tonumber(ARGV[3])
local new_units = tonumber(ARGV[4])
local limit = tonumber(ARGV[5])

-- Prune entries older than the sliding window
redis.call('ZREMRANGEBYSCORE', key, 0, cutoff)

-- Read remaining members + scores
local members = redis.call('ZRANGE', key, 0, -1, 'WITHSCORES')
local used = 0
local oldest = now
for i = 1, #members, 2 do
    local val = tostring(members[i])
    local score = tonumber(members[i+1])
    local u_str = val:match('^(%d+)')
    if u_str then
        used = used + tonumber(u_str)
    end
    if score and score < oldest then
        oldest = score
    end
end

if used + new_units > limit then
    return {0, used, limit, oldest + window_ms}
end

-- Record this request
local member = tostring(new_units) .. ':' .. redis.sha1hex(tostring(now) .. tostring(math.random()))
redis.call('ZADD', key, now, member)
redis.call('EXPIRE', key, math.floor(window_ms / 1000) + 60)

return {1, used + new_units, limit, oldest + window_ms}
"""

_QUOTA_LUA_SHA: str | None = None  # cached SHA for EVALSHA


@dataclass
class QuotaResult:
    """Returned by check_quota — caller decides whether to proceed."""

    allowed: bool
    used: int               # current window usage (units)
    limit: int              # configured limit
    remaining: int          # max(0, limit - used)
    reset_at_ms: int        # earliest timestamp when capacity frees up
    resource: str

    def to_429_body(self) -> dict:
        return {
            "error": "Daily limit reached",
            "resource": self.resource,
            "used": self.used,
            "limit": self.limit,
            "reset_at_ms": self.reset_at_ms,
        }


# ─── Per-resource limits ─────────────────────────────────────────────────────
# Units: characters of text fed to the provider (STT input ≈ output text;
# TTS input is what we synthesize). LLM tokens tracked separately.
#
# Defaults are conservative for free-tier safety. Override per-env if needed.

LIMITS: dict[tuple[str, str], int] = {
    # (tier, resource) → daily char/token budget
    ("free", "sarvam_stt"):     5_000,
    ("free", "sarvam_tts"):     5_000,
    ("free", "cloudflare_stt"): 5_000,
    ("free", "cloudflare_tts"): 5_000,
    ("free", "llm"):           20_000,  # tokens

    ("pro",  "sarvam_stt"):    50_000,
    ("pro",  "sarvam_tts"):    50_000,
    ("pro",  "cloudflare_stt"):50_000,
    ("pro",  "cloudflare_tts"):50_000,
    ("pro",  "llm"):          200_000,  # tokens
}


def limit_for(tier: str, resource: str) -> int:
    return LIMITS.get((tier, resource), LIMITS.get(("free", resource), 5000))


# ─── Redis client (Upstash REST) ─────────────────────────────────────────────


def _upstash_config() -> tuple[Optional[str], Optional[str]]:
    return (
        os.getenv("UPSTASH_REDIS_REST_URL"),
        os.getenv("UPSTASH_REDIS_REST_TOKEN"),
    )


def is_configured() -> bool:
    url, token = _upstash_config()
    return bool(url and token)


async def _upstash_cmd(*args: str) -> Optional[list | str | int]:
    """
    POST a single Redis command to Upstash REST. Returns the unwrapped
    `result` field (whatever shape Redis returned), or None on failure.

    We intentionally swallow errors here — the caller treats None as
    "Redis isn't behaving, fail open" so quota outages don't take the
    voice pipeline down.
    """
    url, token = _upstash_config()
    if not url or not token:
        return None
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            r = await client.post(
                url,
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                json=list(args),
            )
            if r.status_code != 200:
                log.warning("[quota] upstash %d: %s", r.status_code, r.text[:120])
                return None
            data = r.json()
            return data.get("result")
    except (httpx.HTTPError, ValueError) as e:
        log.warning("[quota] upstash request failed: %s", e)
        return None


# ─── Public API ──────────────────────────────────────────────────────────────


def _key(resource: str, user_id: str) -> str:
    return f"quota:{resource}:{user_id}"



async def _eval_quota_script(key: str, now_ms: int, cutoff: int, units: int, limit: int) -> list[int] | None:
    """
    Send the atomic quota Lua script via EVAL or EVALSHA (if SHA cached).
    Returns [allowed, used, limit, reset_at_ms] or None on failure.
    """
    global _QUOTA_LUA_SHA
    args = [key, str(now_ms), str(cutoff), str(WINDOW_MS), str(units), str(limit)]

    # Try EVALSHA first (saves bandwidth if script is already cached)
    if _QUOTA_LUA_SHA:
        result = await _upstash_cmd("EVALSHA", _QUOTA_LUA_SHA, "1", *args)
        if result is not None:
            return result  # type: ignore[return-value]

    # Fall back to EVAL and cache the SHA
    result = await _upstash_cmd("EVAL", _QUOTA_LUA_SCRIPT, "1", *args)
    if isinstance(result, list) and len(result) >= 4:
        # Try to cache SHA from EVAL response if Redis returns it
        # (Upstash REST may not; we'll just use EVAL every time if EVALSHA fails)
        pass
    return result  # type: ignore[return-value]


async def check_and_record(
    user_id: str,
    tier: str,
    resource: str,
    units: int,
) -> QuotaResult:
    """
    Atomically check + record via a Redis Lua script (single round-trip).

    Returns a QuotaResult — caller decides to proceed (allowed=True) or
    return 429 (allowed=False).

    If Redis is unconfigured / unreachable, we FAIL OPEN — better to serve
    the user than to error their whole experience over a cache outage.
    Cost protection comes back online the moment Redis recovers.
    """
    limit = limit_for(tier, resource)

    if not is_configured():
        return QuotaResult(
            allowed=True,
            used=0,
            limit=limit,
            remaining=limit,
            reset_at_ms=int(time.time() * 1000) + WINDOW_MS,
            resource=resource,
        )

    now_ms = int(time.time() * 1000)
    cutoff = now_ms - WINDOW_MS
    key = _key(resource, user_id)

    result = await _eval_quota_script(key, now_ms, cutoff, units, limit)

    if isinstance(result, list) and len(result) >= 4:
        allowed = bool(result[0])
        used = int(result[1])
        effective_limit = int(result[2])
        reset_at_ms = int(result[3])
        return QuotaResult(
            allowed=allowed,
            used=used,
            limit=effective_limit,
            remaining=max(0, effective_limit - used),
            reset_at_ms=reset_at_ms,
            resource=resource,
        )

    # Lua script failed — fail open so a Redis hiccup doesn't break voice.
    log.warning("[quota] Lua script failed — failing open for user=%s resource=%s", user_id, resource)
    return QuotaResult(
        allowed=True,
        used=0,
        limit=limit,
        remaining=limit,
        reset_at_ms=int(time.time() * 1000) + WINDOW_MS,
        resource=resource,
    )
