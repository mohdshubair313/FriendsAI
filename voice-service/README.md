# Friends AI — Voice Service

Python sibling to the Next.js app. Owns voice STT/TTS so we can layer
Sarvam AI (Indian voices) and other Python-native pipelines without
forcing the main app to grow a Python toolchain.

## Architecture

```
Browser → Next.js (UI/auth/orchestrate)
              │  mints HS256 service token
              ▼
         FastAPI (this service, :8001)
              │
              ├─→ Cloudflare Whisper / MeloTTS (today)
              └─→ Sarvam STT/TTS (Phase 3)
```

Auth: every request carries a Bearer JWT minted by the Next.js process
with claims `{ sub, tier, locale, exp, iat }`. We verify with the shared
`VOICE_SERVICE_JWT_SECRET`. NextAuth internals never touch this service.

## Setup (one time)

Requires Python 3.10+.

```powershell
cd "D:\Projects\Spherial Ai\voice-service"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
# Edit .env — paste the same VOICE_SERVICE_JWT_SECRET you put in the Next.js .env
# Paste your CLOUDFLARE_ACCOUNT_ID + CLOUDFLARE_API_TOKEN (same values as the Next.js .env)
```

## Run (every dev session)

```powershell
cd "D:\Projects\Spherial Ai\voice-service"
.\.venv\Scripts\Activate.ps1
python -m app.main
```

The service binds to `127.0.0.1:8001` by default. Hit `http://127.0.0.1:8001/v1/health`
in a browser to confirm — should return `{"ok": true, ...}`.

In another terminal, run the Next.js app as usual (`npm run dev`). With
`VOICE_SERVICE_URL=http://127.0.0.1:8001` set in the Next.js `.env`, voice
routes will route through this service. Without it, they fall back to
calling Cloudflare directly (so you can develop without running this).

## Endpoints

| Path | Auth | Body | Returns |
|---|---|---|---|
| `GET /v1/health` | none | — | `{ok, service, version}` |
| `POST /v1/transcribe` | Bearer | multipart `audio` + `language` | `{text}` |
| `POST /v1/synthesize` | Bearer | JSON `{text, lang}` | `audio/mpeg` |

## Provider routing

`app/voice_router.py` picks the provider per request based on the
BCP-47 language code:

| Language | STT | TTS |
|---|---|---|
| en-US, en-GB, es-ES, fr-FR, ja-JP, zh-CN, ko-KR | Cloudflare Whisper | Cloudflare MeloTTS |
| hi-IN, ta-IN, te-IN, bn-IN, mr-IN, gu-IN, kn-IN, ml-IN, pa-IN, en-IN | **Sarvam saaras-v2 / bulbul-v2** | (auto-fallback to Cloudflare on Sarvam error) |

Without `SARVAM_API_KEY` set, all requests go to Cloudflare (Indian
languages get English voice via MeloTTS — workable, not great). Setting
the key flips the Indian languages to native voices automatically.

Default Sarvam voices per language are in `app/sarvam.py` `DEFAULT_VOICE`.
Common picks: Meera (Hindi), Pavithra (Tamil), Diya (Bengali). Override
per request by extending the request body (Phase 3.5 work).
