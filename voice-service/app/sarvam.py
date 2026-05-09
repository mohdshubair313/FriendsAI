"""
Sarvam AI client — STT (saaras-v2) + TTS (bulbul-v2) for Indian languages.

Why Sarvam over Cloudflare for Indian languages:
  - Cloudflare MeloTTS only speaks en/es/fr/zh/jp/kr — no Indian langs.
  - Cloudflare Whisper handles Hindi STT but with mediocre accuracy on
    code-mixed Hindi-English. Sarvam's saaras-v2 is trained on Indian
    speech and dramatically outperforms it.
  - Sarvam TTS (bulbul-v2) has named voices like Meera, Arjun, Pavithra
    that sound natively Indian.

Free tier: Sarvam gives generous developer credits. Hard limits live in
their dashboard; we don't track here (Phase 3.5 = Redis quota tracker).

API docs: https://docs.sarvam.ai/api-reference-docs
"""

from __future__ import annotations

import base64
import os
from typing import Optional

import httpx

# ─── Config ──────────────────────────────────────────────────────────────────

API_BASE = "https://api.sarvam.ai"
STT_MODEL = "saaras:v2"
TTS_MODEL = "bulbul:v2"

STT_TIMEOUT_S = 25.0  # Sarvam STT is slower than Whisper on first-token
TTS_TIMEOUT_S = 15.0

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
# param on synthesize(). Picks chosen for clarity + warmth (the persona-default
# for a "friendly companion" app).
DEFAULT_VOICE: dict[str, str] = {
    "hi-IN": "meera",
    "ta-IN": "pavithra",
    "te-IN": "maya",
    "bn-IN": "diya",
    "mr-IN": "amol",
    "gu-IN": "neel",
    "kn-IN": "karun",
    "ml-IN": "arvind",
    "pa-IN": "manisha",
    "od-IN": "vidya",
    "en-IN": "meera",  # Meera reads English-India well too
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
    Synthesise with Sarvam bulbul-v2.

    Sarvam returns base64 WAV inside JSON: { "audios": ["..."] }.
    We decode and return raw bytes. Caller serves them as audio/mpeg —
    most browsers handle WAV under that content-type just fine, and the
    proxy layer doesn't re-encode.
    """
    if not supports(language):
        raise SarvamError(f"Unsupported Sarvam language: {language}", "unsupported_lang")

    voice = speaker or DEFAULT_VOICE.get(language, "meera")
    body = {
        "inputs": [text],
        "target_language_code": language,
        "speaker": voice,
        "model": TTS_MODEL,
        "pace": pace,
        "loudness": 1.0,
        "speech_sample_rate": 22050,
        "enable_preprocessing": True,
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
