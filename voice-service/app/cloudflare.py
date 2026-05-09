"""
Cloudflare Workers AI client — Whisper Large v3 Turbo (STT) + MeloTTS (TTS).

Direct port of the contract used by the Next.js src/lib/voice/cloudflareSpeech.ts
helper. Phase 3 will swap these calls for Sarvam's models when language hints
match supported Indian languages.
"""

import base64
import os
from typing import Literal

import httpx

WHISPER_MODEL = "@cf/openai/whisper-large-v3-turbo"
MELOTTS_MODEL = "@cf/myshell-ai/melotts"

STT_TIMEOUT_S = 20.0
TTS_TIMEOUT_S = 15.0

TtsLang = Literal["en", "es", "fr", "zh", "jp", "kr"]
SUPPORTED_TTS_LANGS = {"en", "es", "fr", "zh", "jp", "kr"}


class CloudflareError(Exception):
    """Raised for any non-200 from the Cloudflare AI API."""

    def __init__(self, message: str, code: str):
        super().__init__(message)
        self.code = code


def _endpoint(model_id: str) -> str:
    account_id = os.getenv("CLOUDFLARE_ACCOUNT_ID")
    if not account_id:
        raise CloudflareError("CLOUDFLARE_ACCOUNT_ID not set", "config_missing")
    return f"https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/{model_id}"


def _headers(content_type: str) -> dict:
    token = os.getenv("CLOUDFLARE_API_TOKEN")
    if not token:
        raise CloudflareError("CLOUDFLARE_API_TOKEN not set", "config_missing")
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": content_type,
    }


async def transcribe(audio_bytes: bytes, language: str = "en") -> str:
    """
    Whisper Turbo expects JSON with base64 audio (NOT raw octet-stream — that's
    the older @cf/openai/whisper model's contract; the turbo variant rejects
    bytes with code 8001 "Invalid input").
    """
    body = {
        "audio": base64.b64encode(audio_bytes).decode("ascii"),
        "language": language,
        "task": "transcribe",
        "vad_filter": True,
    }
    async with httpx.AsyncClient(timeout=STT_TIMEOUT_S) as client:
        try:
            r = await client.post(_endpoint(WHISPER_MODEL), json=body, headers=_headers("application/json"))
        except httpx.TimeoutException:
            raise CloudflareError("whisper timed out", "provider_timeout")
        except httpx.HTTPError as e:
            raise CloudflareError(f"whisper request failed: {e}", "provider_failed")

    if r.status_code != 200:
        raise CloudflareError(
            f"whisper HTTP {r.status_code}: {r.text[:200]}",
            "provider_failed",
        )
    try:
        data = r.json()
    except ValueError as e:
        raise CloudflareError(f"whisper response not JSON: {e}", "decode_failed")
    text = (data.get("result", {}).get("text") or "").strip()
    return text


async def synthesize(text: str, lang: TtsLang = "en") -> bytes:
    """
    MeloTTS returns base64 MP3 inside JSON (despite the docs hinting binary).
    We decode and return raw audio bytes.
    """
    safe_lang = lang if lang in SUPPORTED_TTS_LANGS else "en"
    body = {"prompt": text, "lang": safe_lang}
    async with httpx.AsyncClient(timeout=TTS_TIMEOUT_S) as client:
        try:
            r = await client.post(
                _endpoint(MELOTTS_MODEL),
                json=body,
                headers=_headers("application/json"),
            )
        except httpx.TimeoutException:
            raise CloudflareError("melotts timed out", "provider_timeout")
        except httpx.HTTPError as e:
            raise CloudflareError(f"melotts request failed: {e}", "provider_failed")

    if r.status_code != 200:
        raise CloudflareError(
            f"melotts HTTP {r.status_code}: {r.text[:200]}",
            "provider_failed",
        )
    try:
        data = r.json()
    except ValueError as e:
        raise CloudflareError(f"melotts response not JSON: {e}", "decode_failed")
    b64 = data.get("result", {}).get("audio")
    if not b64:
        raise CloudflareError("melotts returned no audio payload", "provider_failed")
    try:
        return base64.b64decode(b64)
    except (ValueError, TypeError) as e:
        raise CloudflareError(f"melotts base64 decode failed: {e}", "decode_failed")
