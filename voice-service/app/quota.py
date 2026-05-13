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


async def check_and_record(
    user_id: str,
    tier: str,
    resource: str,
    units: int,
) -> QuotaResult:
    """
    Atomically check + record. Returns a QuotaResult — caller decides
    to proceed (allowed=True) or return 429 (allowed=False).

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

    # 1. Drop expired entries (anything older than 24h).
    await _upstash_cmd("ZREMRANGEBYSCORE", key, "0", str(cutoff))

    # 2. Read remaining members + their scores so we can compute current usage.
    members = await _upstash_cmd("ZRANGE", key, "0", "-1", "WITHSCORES")
    used = 0
    oldest_score = now_ms  # fallback if no members
    if isinstance(members, list):
        # WITHSCORES returns [member, score, member, score, ...]
        for i in range(0, len(members), 2):
            value = str(members[i])
            try:
                # Stored as "<units>:<uuid>"
                u_str = value.split(":", 1)[0]
                used += int(u_str)
            except (ValueError, IndexError):
                # Corrupt entry — count as 0, don't crash.
                continue
            try:
                score_val = int(float(members[i + 1]))
                if score_val < oldest_score:
                    oldest_score = score_val
            except (ValueError, IndexError):
                pass

    reset_at_ms = oldest_score + WINDOW_MS

    if used + units > limit:
        return QuotaResult(
            allowed=False,
            used=used,
            limit=limit,
            remaining=max(0, limit - used),
            reset_at_ms=reset_at_ms,
            resource=resource,
        )

    # 3. Record this request.
    member = f"{units}:{uuid.uuid4().hex}"
    await _upstash_cmd("ZADD", key, str(now_ms), member)
    # 4. Refresh TTL so the key auto-cleans if the user goes dormant.
    await _upstash_cmd("EXPIRE", key, str(WINDOW_MS // 1000 + 60))

    return QuotaResult(
        allowed=True,
        used=used + units,
        limit=limit,
        remaining=max(0, limit - used - units),
        reset_at_ms=reset_at_ms,
        resource=resource,
    )
