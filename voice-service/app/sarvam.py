"""
Sarvam AI client — STT (saaras-v2) + TTS (bulbul-v3) for Indian languages.

Why Sarvam over Cloudflare for Indian languages:
  - Cloudflare MeloTTS only speaks en/es/fr/zh/jp/kr — no Indian langs.
  - Cloudflare Whisper handles Hindi STT but with mediocre accuracy on
    code-mixed Hindi-English. Sarvam's saaras-v2 is trained on Indian
    speech and dramatically outperforms it.
  - Sarvam TTS (bulbul-v3) has 30+ speakers with natively Indian prosody,
    improved quality, and higher sample rates vs bulbul-v2.

Free tier: Sarvam gives generous developer credits. Hard limits live in
their dashboard; we don't track here (Phase 3.5 = Redis quota tracker).

API docs: https://docs.sarvam.ai/api-reference-docs
Upgraded to bulbul:v3 (2025-09): text (not inputs array), no pitch/loudness,
enable_preprocessing removed. Default speaker shubh.
"""

from __future__ import annotations

import base64
import os
from typing import Optional

import httpx

# ─── Config ──────────────────────────────────────────────────────────────────

API_BASE = "https://api.sarvam.ai"
STT_MODEL = "saaras:v2"
TTS_MODEL = "bulbul:v3"

STT_TIMEOUT_S = 25.0  # Sarvam STT is slower than Whisper on first-token
TTS_TIMEOUT_S = 30.0  # v3 can be slightly slower on long text; bumped from 15s

# Languages Sarvam supports (BCP-47 with -IN region).
SUPPORTED_LANGS: set[str] = {
    "hi-IN",  # Hindi
    "ta-IN",  # Tamil
    "te-IN",  # Telugu
    "bn-IN",  # Bengali
    "mr-IN",  # Marathi
    "gu-IN",  # Gujarati
    "kn-IN",  # Kannada
    "ml-IN",  # Malayalam
    "pa-IN",  # Punjabi
    "od-IN",  # Odia
    "en-IN",  # English (India) — also handled by Sarvam for Indian-accent STT
}

# Default voice per language. Users can override per-request via the `speaker`
# param on synthesize(). bulbul:v3 speakers are language-agnostic — the same
# speaker adapts to all 11 supported languages — so "shubh" (neutral, pleasant)
# is the universal default.
# The catalog.ts file in Next.js maps voiceStyle IDs (warm_female, confident_male,
# etc.) to v3-compatible speakers (anushka, abhilash, kavya, ashutosh — all
# valid in bulbul:v3). When a style is selected, it passes the resolved speaker
# name via the `speaker` param, bypassing DEFAULT_VOICE.
DEFAULT_VOICE: dict[str, str] = {
    "hi-IN": "shubh",
    "ta-IN": "shubh",
    "te-IN": "shubh",
    "bn-IN": "shubh",
    "mr-IN": "shubh",
    "gu-IN": "shubh",
    "kn-IN": "shubh",
    "ml-IN": "shubh",
    "pa-IN": "shubh",
    "od-IN": "shubh",
    "en-IN": "shubh",
}


class SarvamError(Exception):
    """Raised for any non-200 from Sarvam's API."""

    def __init__(self, message: str, code: str):
        super().__init__(message)
        self.code = code


def is_configured() -> bool:
    return bool(os.getenv("SARVAM_API_KEY"))


def supports(language: str) -> bool:
    """Whether Sarvam can handle this BCP-47 language code."""
    return language in SUPPORTED_LANGS


def _headers() -> dict:
    key = os.getenv("SARVAM_API_KEY")
    if not key:
        raise SarvamError("SARVAM_API_KEY not set", "config_missing")
    return {"api-subscription-key": key}


# ─── Speech-to-Text ──────────────────────────────────────────────────────────


async def transcribe(audio_bytes: bytes, language: str) -> str:
    """
    Transcribe with Sarvam saaras-v2.

    Sarvam's STT endpoint is multipart with the audio as a file field.
    Response shape: { "transcript": "...", "language_code": "...", ... }
    """
    if not supports(language):
        raise SarvamError(f"Unsupported Sarvam language: {language}", "unsupported_lang")

    files = {
        "file": ("audio.webm", audio_bytes, "audio/webm"),
    }
    data = {
        "model": STT_MODEL,
        "language_code": language,
        # with_timestamps + with_diarization off for lowest latency
    }

    async with httpx.AsyncClient(timeout=STT_TIMEOUT_S) as client:
        try:
            r = await client.post(
                f"{API_BASE}/speech-to-text",
                headers=_headers(),
                files=files,
                data=data,
            )
        except httpx.TimeoutException:
            raise SarvamError("saaras timed out", "provider_timeout")
        except httpx.HTTPError as e:
            raise SarvamError(f"saaras request failed: {e}", "provider_failed")

    if r.status_code != 200:
        raise SarvamError(
            f"saaras HTTP {r.status_code}: {r.text[:200]}",
            "provider_failed",
        )
    try:
        data = r.json()
    except ValueError as e:
        raise SarvamError(f"saaras response not JSON: {e}", "decode_failed")
    return (data.get("transcript") or "").strip()


# ─── Text-to-Speech ──────────────────────────────────────────────────────────


async def synthesize(
    text: str,
    language: str,
    speaker: Optional[str] = None,
    pace: float = 1.0,
) -> bytes:
    """
    Synthesise with Sarvam bulbul-v3.

    v3 API differences from v2:
      - Uses `text` (singular string) instead of `inputs` array
      - No `pitch`, `loudness`, `enable_preprocessing` params
      - Default speaker is `shubh` (was `anushka` in v2)
      - Supports higher sample rates (up to 48 kHz)

    Sarvam returns base64 WAV inside JSON: { "audios": ["..."] }.
    We decode and return raw bytes. Caller serves them as audio/mpeg —
    most browsers handle WAV under that content-type just fine, and the
    proxy layer doesn't re-encode.
    """
    if not supports(language):
        raise SarvamError(f"Unsupported Sarvam language: {language}", "unsupported_lang")

    voice = speaker or DEFAULT_VOICE.get(language, "shubh")
    body = {
        "text": text,
        "target_language_code": language,
        "speaker": voice,
        "model": TTS_MODEL,
        "pace": pace,
        "speech_sample_rate": 24000,
    }

    async with httpx.AsyncClient(timeout=TTS_TIMEOUT_S) as client:
        try:
            r = await client.post(
                f"{API_BASE}/text-to-speech",
                headers={**_headers(), "Content-Type": "application/json"},
                json=body,
            )
        except httpx.TimeoutException:
            raise SarvamError("bulbul timed out", "provider_timeout")
        except httpx.HTTPError as e:
            raise SarvamError(f"bulbul request failed: {e}", "provider_failed")

    if r.status_code != 200:
        raise SarvamError(
            f"bulbul HTTP {r.status_code}: {r.text[:200]}",
            "provider_failed",
        )
    try:
        data = r.json()
    except ValueError as e:
        raise SarvamError(f"bulbul response not JSON: {e}", "decode_failed")
    audios = data.get("audios") or []
    if not audios:
        raise SarvamError("bulbul returned no audio", "provider_failed")
    try:
        return base64.b64decode(audios[0])
    except (ValueError, TypeError) as e:
        raise SarvamError(f"bulbul base64 decode failed: {e}", "decode_failed")
