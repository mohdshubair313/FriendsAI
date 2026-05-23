# Actual Architecture

> **Important:** LangGraph is NOT used in production code. It exists only in `package.json` and one mock code example string inside `ClientChatV2.tsx`. All old LangGraph pipelines have been replaced with simpler direct approaches.

---

## High-Level Flow

```
Client (Browser)
     │
     ▼
POST /api/orchestrate  ──── single entry point for chat + image
     │                          (SSE stream response)
     │
     ▼
detectIntent() via regex  ──── checks if message starts with
     │                          /image, /img, /draw, /generate
     │
     ┌────────┴────────┐
     │                 │
   "chat"           "image"
     │                 │
     ▼                 ▼
streamChat()      generateImage()
(LLM streaming)   (Cloudflare Flux → Cloudinary)
     │                 │
     └────────┬────────┘
              │
              ▼
      SSE events streamed to client
```

---

## Services Breakdown

### 1. Orchestrate Route (`src/app/api/orchestrate/route.ts`)

- Main POST endpoint for both chat and image generation
- Uses SSE (Server-Sent Events) to stream responses
- Steps: Auth check → Parse body → Regex intent detection → Execute path → Stream events
- Saves messages to MongoDB (fire-and-forget)
- Stores session in Redis (voice session cache)
- Sends telemetry metrics

### 2. Intent Router (`src/lib/chat/intentRouter.ts`)

- Pure regex — no LLM calls
- Checks for: `/image`, `/img`, `/draw`, `/generate` at start of message
- Returns `"chat"` or `"image"`
- Also strips the prefix before passing prompt to image generator

### 3. Chat Streaming (`src/lib/chat/streamChat.ts`)

- Direct LLM streaming with model fallback chain
- Order: `@cf/meta/llama-3.1-8b-instruct` → `baidu/cobuddy:free` → `nvidia/nemotron-3-nano-omni-30b` → `nvidia/nemotron-3-super-120b`
- First 2 models run via Cloudflare Workers AI (raw fetch + SSE parsing)
- Last 2 models run via LangChain's ChatOpenAI (OpenRouter)
- Each model has 4s first-token deadline and 45s total deadline
- On failure → transparently falls to next model
- System prompt built dynamically with persona + mood + expression

### 4. Image Generation (`src/lib/chat/generateImage.ts`)

- Cloudflare Workers AI (flux-1-schnell) → base64 decode → Cloudinary upload
- All sync — no queue, no background worker
- Total wall time: ~5-8s
- Custom `ImageGenerationError` with codes for user-facing messages

### 5. System Prompt Builder (`src/lib/chat/systemPrompt.ts`)

Layers:
1. Base persona ("emotionally intelligent companion")
2. Role-specific persona instruction (from personas.ts)
3. Mood tone (friendly/happy/sad/funny/romantic/angry/motivational/philosophical)
4. Optional visual context from MediaPipe expression
5. Style rules + safety guardrails

### 6. Personas (`src/lib/chat/personas.ts`)

8 personas available:

| Key | Name | Description |
|---|---|---|
| `friendly` | Friendly | Warm, helpful default |
| `humorous` | Humorous | Light wit, clever asides |
| `philosophical` | Philosophical | Thoughtful, Socratic |
| `romantic` | Romantic | Poetic, sincere |
| `motivational` | Motivational | Direct, action-oriented |
| `doctor` | Dr. Mehra | Empathetic physician |
| `comedian` | Riz the Comedian | Stand-up comic |
| `senior_dev` | Senior Dev | Code-first engineer |

Each has: instruction, openingLine, emoji, glow palette, avatarUrl

### 7. Provider Registry (`src/services/providers/registry.ts`)

- Maps task types to model configs
- Used for key lookup (`getProviderApiKey`)
- Actual model fallback chain lives in `streamChat.ts`
- Mostly documentation/reference — not actively routing

---

## Voice System

### Client Side (Live Talk)

```
Audio from mic
     │
     ▼
GeminiWebSocket (src/services/geminiWebSockets.ts)
     │
     ├── Connect to Gemini BidiGenerateContent WebSocket
     ├── Send audio chunks → Receive audio + text response
     ├── Play audio via Web Audio API
     └── Transcribe response audio → display as text
```

### Server Side

```
                     ┌──────────────────┐
                     │  Python FastAPI   │
                     │  (port 8001)      │
                     │                   │
                     │  voice_router.py  │
                     │    │          │   │
                     │    ▼          ▼   │
                     │ Cloudflare  Sarvam│
                     │ (Whisper +   (for │
                     │  MeloTTS)    IN   │
                     │             langs)│
                     └──────────────────┘
                           △
                           │ proxy
                           │
┌──────────────────────────────────────────────┐
│            Next.js API Routes                │
│                                              │
│  /api/voice/transcribe ──────────────────────┤
│    → tries Python proxy first                │
│    → falls back to direct Cloudflare Whisper │
│                                              │
│  /api/voice/synthesize ──────────────────────┤
│    → tries Python proxy first                │
│    → falls back to direct Cloudflare MeloTTS │
│                                              │
│  /api/voice/session ─────────────────────────┤
│    → returns Gemini WebSocket URL + config   │
│                                              │
│  /api/voice/heartbeat ───────────────────────┤
│  /api/voice/interrupt ───────────────────────┤
│  /api/voice/resume ──────────────────────────┘
```

### Voice Service (Python FastAPI)

- **Transcribe (STT)**: Cloudflare Whisper Large v3 Turbo (default) → Sarvam saaras:v2 (Indian languages)
- **Synthesize (TTS)**: Cloudflare MeloTTS (default) → Sarvam bulbul:v2 (Indian languages, voices: anushka, abhilash, kavya, ashutosh)
- **Router logic**: If language ends with `-IN` AND Sarvam API key is configured → try Sarvam first, fallback to Cloudflare
- **Auth**: JWT tokens minted by Next.js, verified by FastAPI
- **Quota**: Per-user rate limiting via Redis

### Voice Catalog (`src/lib/voices/catalog.ts`)

4 voice styles:
- Warm Female (anushka)
- Confident Male (abhilash)
- Bright & Playful (kavya)
- Calm Senior (ashutosh)

All 11 Indian languages share the same speaker mapping.

---

## Avatar System

### Face Detection (`src/lib/face/`)

- `useFaceLandmarks.ts` — React hook, runs MediaPipe FaceLandmarker
- Polls at 5Hz from hidden video element
- CPU delegate (avoids WebGL context limit issues with R3F)
- Privacy: only derived expression labels leave the hook — no frames sent to server

- `expressionMapper.ts` — Maps 52 ARKit blendshapes to: neutral, smiling, frowning, surprised, thinking, nodding
- Includes `ExpressionSmoother` for hysteresis (prevents flickering)

### WebRTC (`src/services/avatar/webrtcService.ts`)

- Creates avatar sessions in MongoDB
- Returns room ID + mock token + ICE servers
- Handles SDP offer/answer exchange
- Premium feature — checks entitlement before creating room

### Animation (`src/services/avatar/avatarAnimationService.ts`)

Generates animation frames with:
1. **Audio-driven visemes**: lip sync from PCM audio volume
2. **Sentiment-driven expressions**: brow, smile, squint from score/arousal
3. **Intent-driven gestures**: wave_hello, empathetic_nod, hands_up_defensive

---

## Data Flow for Each Mode

### Chat Mode
```
User types text → POST /api/orchestrate
  → regex detectIntent = "chat"
  → streamChat() with persona + mood + expression
  → LLM model loop (CF → fallback)
  → tokens streamed via SSE {type:"token", content:"..."}
  → MongoDB: save user msg + assistant msg (fire-and-forget)
  → Redis: update voice session
  → Telemetry: record turn metric
  → SSE: {type:"done"}
```

### Image Mode
```
User types "/image a cat" → POST /api/orchestrate
  → regex detectIntent = "image"
  → stripImagePrefix → "a cat"
  → MediaJob.create({status:"running"})
  → SSE: {type:"image_progress", phase:"generating"}
  → generateImage("a cat")
    → Cloudflare flux-1-schnell → base64 image
    → Cloudinary upload → CDN URL
  → SSE: {type:"image_progress", phase:"uploading"}
  → MediaJob.update({status:"succeeded", resultUrl})
  → MongoDB: save assistant msg with image URL
  → SSE: {type:"image_done", url, prompt}
```

### Live Talk Mode
```
User speaks → browser mic → Gemini WebSocket
  → Gemini receives audio, replies with audio + text
  → Client plays audio, displays transcription
  → Face landmarks detected via MediaPipe (5Hz)
  → Expression sent to /api/orchestrate for context
  → Parallel: /api/voice/transcribe (Whisper/Sarvam)
  → Voice session stored in Redis for reconnect
```

### Avatar Mode
```
Client → /api/avatar/session → WebRTC room created
  → SDP exchange via /api/avatar/signal
  → MediaPipe face detection starts
  → Audio → visemes via volume analysis
  → Sentiment → facial expressions
  → Intent → gesture triggers
```

---

## Database & Storage

| Data | Location | Purpose |
|---|---|---|
| Conversations | MongoDB | Chat history |
| Messages | MongoDB (separate collection) | Individual message parts |
| Users | MongoDB | Auth, preferences |
| Avatar Sessions | MongoDB | WebRTC session tracking |
| Media Jobs | MongoDB | Image generation tracking |
| Voice Sessions | Redis (Upstash) | Ephemeral state for reconnect |
| Images | Cloudinary | Hosted CDN for generated images |
| Emotions | MongoDB | Expression events log |

---

## Auth Flow

```
NextAuth.js (credentials provider)
     │
     ├── Signup → bcrypt hash → MongoDB
     ├── Login → JWT token (next-auth)
     ├── Middleware checks token
     └── Voice Service → JWT via jose (HS256, 5min TTL)
```

---

## Key Technical Decisions

1. **No LangGraph**: Replaced with regex intent routing + direct LLM streaming. Faster, simpler, zero false positives for slash commands.

2. **No Queue/Worker**: Image generation is fully sync (~5-8s). Fits within Vercel limits. Previous BullMQ + worker pattern removed.

3. **Proxy-first for Voice**: Next.js routes try Python FastAPI first → fall back to direct Cloudflare calls. Graceful degradation.

4. **Client-side Face Detection**: MediaPipe runs entirely in browser. Only derived expression labels transmitted.

5. **Model Fallback Chain**: 4 models tried sequentially with deadlines. Fastest-first ordering. Partial responses preserved on timeout.
