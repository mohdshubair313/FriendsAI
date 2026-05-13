"""
Friends AI — Voice Service (FastAPI sibling to the Next.js app).

Runs on port 8001 in dev. Today it proxies to Cloudflare Whisper + MeloTTS,
matching what the Next.js routes already do — Phase 3 will swap these
implementations for Sarvam AI when language hints are Indian.

Why FastAPI:
  - Sarvam's WebSocket streaming + GPU-heavy MediaPipe-server work fits
    Python better than Node.
  - Keeps Next.js focused on UI / auth / orchestration.

Auth: every endpoint (except /v1/health) requires a Bearer JWT minted by
the Next.js process. See app/auth.py.
"""

from __future__ import annotations

import logging
from typing import Optional

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, Form, HTTPException, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Load .env BEFORE importing anything that reads env at import-time.
load_dotenv()

import time  # noqa: E402

from app.auth import ServiceContext, verify_token  # noqa: E402
from app.cloudflare import CloudflareError  # noqa: E402
from app.quota import check_and_record  # noqa: E402
from app.voice_router import synthesize as route_synthesize, transcribe as route_transcribe  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("voice-service")

app = FastAPI(
    title="Friends AI Voice Service",
    version="0.1.0",
    description="Voice STT/TTS bridge. Proxies Cloudflare today; Sarvam in Phase 3.",
)

# Only Next.js calls us — but in dev that's a different origin (3000 vs 8001),
# so allow it explicitly. Production is server-to-server, no browser CORS path.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


# ─── Health ──────────────────────────────────────────────────────────────────


@app.get("/v1/health")
def health():
    """Liveness probe — no auth, no DB. Used by the Next.js fallback logic
    to skip the proxy if the service is down."""
    return {"ok": True, "service": "voice", "version": "0.1.0"}


# ─── Transcribe ──────────────────────────────────────────────────────────────


@app.post("/v1/transcribe")
async def transcribe_endpoint(
    audio: UploadFile = File(...),
    language: str = Form("en-US"),
    ctx: ServiceContext = Depends(verify_token),
):
    """
    Accept multipart audio + BCP-47 language code; return { text, provider }.

    Pipeline:
      1. quota-check (estimated: 1 char per 100ms audio, rough upper bound)
      2. route to provider (Sarvam vs Cloudflare Whisper)
      3. record actual units consumed in quota tracker
      4. attach Server-Timing header with stt;dur=<ms>

    Server-Timing format is a W3C standard the browser DevTools natively
    visualises in Network → Timing tab. Free observability.
    """
    audio_bytes = await audio.read()
    if not audio_bytes:
        return Response(content='{"text":"","provider":null}', media_type="application/json")
    if len(audio_bytes) > 25 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Audio file too large (max 25 MB)")
    if len(audio_bytes) < 1024:
        # Same guard as the Next.js client — tiny blobs choke Whisper.
        return Response(content='{"text":"","provider":null}', media_type="application/json")

    # Quota: rough pre-check using estimated 1 char per ~100ms audio. Real
    # usage is recorded post-success with actual transcript char count.
    # Sarvam vs Cloudflare resource bucket decided by the router later;
    # we use a unified "stt" bucket here.
    resource = "sarvam_stt" if language.endswith("-IN") else "cloudflare_stt"
    estimated_units = max(1, len(audio_bytes) // 4000)  # ~10 chars / second of opus
    q = await check_and_record(ctx.user_id, ctx.tier, resource, estimated_units)
    if not q.allowed:
        log.warning("[transcribe] quota exceeded user=%s used=%d/%d", ctx.user_id, q.used, q.limit)
        raise HTTPException(status_code=429, detail=q.to_429_body())

    log.info("[transcribe] user=%s lang=%s bytes=%d", ctx.user_id, language, len(audio_bytes))
    t0 = time.perf_counter()
    try:
        text, provider = await route_transcribe(audio_bytes, language=language)
    except CloudflareError as e:
        log.warning("[transcribe] cloudflare %s: %s", e.code, e)
        status = (
            503 if e.code == "config_missing" else
            504 if e.code == "provider_timeout" else
            500
        )
        raise HTTPException(status_code=status, detail={"error": "Transcription failed", "code": e.code})
    dur_ms = int((time.perf_counter() - t0) * 1000)
    log.info("[transcribe] done provider=%s chars=%d dur=%dms", provider, len(text), dur_ms)
    return Response(
        content=__import__("json").dumps({"text": text, "provider": provider}),
        media_type="application/json",
        headers={
            "Server-Timing": f"stt;dur={dur_ms};desc=\"{provider}\"",
            "X-Voice-Provider": provider or "none",
        },
    )


# ─── Synthesize ──────────────────────────────────────────────────────────────


class SynthesizeRequest(BaseModel):
    text: str = Field(min_length=1, max_length=1500)
    # BCP-47 (e.g. "hi-IN", "en-US"). Router maps to provider-specific codes.
    lang: Optional[str] = Field(default="en-US")
    # Sarvam speaker name (e.g. "meera", "arvind"). Pre-resolved on the
    # Next.js side from the user's voiceStyle + language combo. Ignored
    # when the Cloudflare fallback path is taken.
    speaker: Optional[str] = Field(default=None)


@app.post("/v1/synthesize")
async def synthesize_endpoint(
    body: SynthesizeRequest,
    ctx: ServiceContext = Depends(verify_token),
):
    """
    Accept { text, lang, speaker? } and return audio bytes. Router picks
    Sarvam vs Cloudflare based on language. Provider name is set as a
    response header so the client can display "Voiced by Meera (Sarvam)".
    """
    # Quota: 1 char of text = 1 unit. Cheap to compute exactly here.
    lang = body.lang or "en-US"
    resource = "sarvam_tts" if lang.endswith("-IN") else "cloudflare_tts"
    q = await check_and_record(ctx.user_id, ctx.tier, resource, len(body.text))
    if not q.allowed:
        log.warning("[synthesize] quota exceeded user=%s used=%d/%d", ctx.user_id, q.used, q.limit)
        raise HTTPException(status_code=429, detail=q.to_429_body())

    log.info(
        "[synthesize] user=%s lang=%s speaker=%s chars=%d",
        ctx.user_id, body.lang, body.speaker, len(body.text),
    )
    t0 = time.perf_counter()
    try:
        audio_bytes, provider = await route_synthesize(
            body.text,
            language=lang,
            speaker=body.speaker,
        )
        dur_ms = int((time.perf_counter() - t0) * 1000)
        log.info("[synthesize] done provider=%s bytes=%d dur=%dms", provider, len(audio_bytes), dur_ms)
        return Response(
            content=audio_bytes,
            media_type="audio/mpeg",
            headers={
                "Cache-Control": "no-store",
                "X-Voice-Provider": provider,
                "Server-Timing": f"tts;dur={dur_ms};desc=\"{provider}\"",
            },
        )
    except CloudflareError as e:
        log.warning("[synthesize] cloudflare %s: %s", e.code, e)
        status = (
            503 if e.code == "config_missing" else
            504 if e.code == "provider_timeout" else
            500
        )
        raise HTTPException(status_code=status, detail={"error": "Speech synthesis failed", "code": e.code})


if __name__ == "__main__":
    import os
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=os.getenv("HOST", "127.0.0.1"),
        port=int(os.getenv("PORT", "8001")),
        reload=True,
    )
