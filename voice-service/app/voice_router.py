"""
Voice provider router.

Picks Sarvam vs Cloudflare per request based on:
  1. Language (Indian → Sarvam, else → Cloudflare)
  2. Whether Sarvam is configured (env-gated)
  3. Whether Sarvam succeeds (auto-fallback to Cloudflare on failure)

The router lets us add more providers later (Google TTS Neural2, ElevenLabs)
by extending one file — endpoint code in main.py stays unchanged.
"""

from __future__ import annotations

import logging
from typing import Literal, Tuple

from app import cloudflare, sarvam

log = logging.getLogger("voice-router")

Provider = Literal["sarvam", "cloudflare"]

# 2-letter Whisper code per BCP-47 we know about. Sarvam handles these too,
# but if it's down we fall back to Whisper which needs the short form.
BCP47_TO_WHISPER: dict[str, str] = {
    "en-US": "en", "en-IN": "en", "en-GB": "en",
    "hi-IN": "hi", "ta-IN": "ta", "te-IN": "te", "bn-IN": "bn",
    "mr-IN": "mr", "gu-IN": "gu", "kn-IN": "kn", "ml-IN": "ml",
    "pa-IN": "pa", "od-IN": "or",
    "es-ES": "es", "es-MX": "es", "fr-FR": "fr",
    "ja-JP": "ja", "zh-CN": "zh", "ko-KR": "ko",
}

# 2-letter MeloTTS code per BCP-47 (subset MeloTTS speaks). Indian langs
# fall back to "en" which is the safe default — caller knows the audio
# won't be in the user's language but at least gets *some* audio.
BCP47_TO_MELOTTS: dict[str, str] = {
    "en-US": "en", "en-IN": "en", "en-GB": "en",
    "es-ES": "es", "es-MX": "es",
    "fr-FR": "fr",
    "ja-JP": "jp", "zh-CN": "zh", "ko-KR": "kr",
}


def _whisper_lang(bcp47: str) -> str:
    return BCP47_TO_WHISPER.get(bcp47, bcp47.split("-")[0].lower() if bcp47 else "en")


def _melotts_lang(bcp47: str) -> Literal["en", "es", "fr", "zh", "jp", "kr"]:
    val = BCP47_TO_MELOTTS.get(bcp47, "en")
    # mypy/runtime: ensure literal subset
    return val if val in ("en", "es", "fr", "zh", "jp", "kr") else "en"  # type: ignore[return-value]


# ─── STT router ──────────────────────────────────────────────────────────────


async def transcribe(audio_bytes: bytes, language: str) -> Tuple[str, Provider]:
    """
    Returns (transcript, provider_used).

    Routing:
      - Sarvam-supported language + Sarvam configured → try Sarvam first
      - Anything else, or Sarvam failure → Cloudflare Whisper
    """
    use_sarvam = sarvam.is_configured() and sarvam.supports(language)

    if use_sarvam:
        try:
            text = await sarvam.transcribe(audio_bytes, language)
            return text, "sarvam"
        except sarvam.SarvamError as e:
            log.warning("[router] sarvam STT failed (%s) — falling back to cloudflare", e.code)

    text = await cloudflare.transcribe(audio_bytes, language=_whisper_lang(language))
    return text, "cloudflare"


# ─── TTS router ──────────────────────────────────────────────────────────────


async def synthesize(text: str, language: str) -> Tuple[bytes, Provider]:
    """
    Returns (audio_bytes, provider_used).

    Routing:
      - Sarvam-supported language + Sarvam configured → try Sarvam first
      - Anything else → Cloudflare MeloTTS (English fallback for Indian if
        Sarvam is unavailable)
    """
    use_sarvam = sarvam.is_configured() and sarvam.supports(language)

    if use_sarvam:
        try:
            audio = await sarvam.synthesize(text, language=language)
            return audio, "sarvam"
        except sarvam.SarvamError as e:
            log.warning("[router] sarvam TTS failed (%s) — falling back to cloudflare", e.code)

    audio = await cloudflare.synthesize(text, lang=_melotts_lang(language))
    return audio, "cloudflare"
