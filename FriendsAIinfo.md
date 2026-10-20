# 🌌 Spherial AI — The Complete Story

> *Imagine a friend who's always there — not a cold chatbot, but a warm presence that listens, sees your face, speaks your language, draws what you dream, and remembers your name. That's Spherial AI.*

---

## 🧬 What Is Spherial AI?

**Spherial AI** (formerly *Friends AI*) is a **next-generation, multi-modal emotional companion platform** — an AI friend that doesn't just text back, but *talks to you in real-time, reads your facial expressions, generates images on command, speaks in 11 Indian languages, and adapts its entire personality to match your mood.*

It's not a simple ChatGPT wrapper. It's a production-grade, multi-service, event-driven platform built from scratch with a custom orchestration engine, policy-driven model routing, real-time voice pipelines, 3D avatar rendering, subscription billing, and a fully containerized deployment stack.

At its core, the project answers one question: **What would it feel like if AI could truly be your friend?**

---

## 🛠️ The Technology DNA

### Languages
| Layer | Language |
|---|---|
| Frontend + API | **TypeScript** (strict mode, end-to-end type safety) |
| Voice Service | **Python 3.11+** (FastAPI, async-first) |
| Styling | **TailwindCSS v3** + **Vanilla CSS** |
| Markup | **HTML5** (semantic, SEO-optimized) |

### Frameworks & Libraries

| Category | Technology | Why It Was Chosen |
|---|---|---|
| **Web Framework** | **Next.js 16+** (App Router) | Server Components, API routes, middleware, and streaming — all in one framework. Edge-ready. |
| **React** | **React 19** | Latest concurrent features. Streaming SSR, Suspense boundaries, server actions. |
| **AI Orchestration** | **LangChain + LangGraph** | Graph-based agent orchestration. Intent → Safety → Sentiment → Supervisor → Specialized Agent. |
| **3D Rendering** | **Three.js** + **React Three Fiber** + **Drei** | Real-time 3D avatar rendering in the browser. Ready Player Me GLB models with ARKit blend shapes for lip-sync and facial animation. |
| **Face Detection** | **MediaPipe Tasks Vision** | Browser-side facial landmark detection. Maps 478 face landmarks to 5 expression categories (smiling, frowning, surprised, thinking, nodding) in real-time at ~30fps. |
| **State Management** | **Redux Toolkit** | Global client state — 5 slices: `chatSlice`, `personaSlice`, `voiceSlice`, `localeSlice`, `premiumSlice`. |
| **Forms** | **React Hook Form** + **Zod** | Type-safe form validation. Zod schemas shared between client and server. |
| **Animations** | **Framer Motion** + **Motion** | Micro-animations, page transitions, parallax, spring physics. The landing page is alive with motion. |
| **UI Primitives** | **Radix UI** (Avatar, Label, ScrollArea, Select, Tooltip) | Accessible, unstyled headless components. |
| **Icons** | **Lucide React**, **Tabler Icons**, **FontAwesome** | Three icon sets for maximum design flexibility. |
| **Markdown** | **React Markdown** + **rehype-raw** + **remark-gfm** | Renders AI responses as rich markdown with GitHub-flavored tables, code blocks, and raw HTML. |
| **Toasts** | **Sonner** | Beautiful, stackable toast notifications. |
| **Auth** | **NextAuth v4** | JWT sessions, 30-day expiry. Google, GitHub, and Credentials providers. |
| **Database ORM** | **Mongoose** | MongoDB ODM with TypeScript interfaces, global connection caching, and compound indices. |
| **Payments** | **Razorpay SDK** | Indian payment gateway. Order creation, payment verification, webhook handling. |
| **Voice Service** | **FastAPI** + **Uvicorn** | Python async HTTP server for voice STT/TTS. Hot-reloadable in dev. |
| **HTTP Client (Python)** | **httpx** | Async HTTP client for Sarvam and Cloudflare API calls. |
| **Testing** | **Vitest** | Fast, Vite-native test runner. |
| **Linting** | **ESLint** (Next.js config) | Consistent code style enforcement. |

---

## 🏗️ Architecture — The Big Picture

Spherial AI follows a **polyglot microservice architecture** wrapped around a **Next.js monolith core**. Think of it as a solar system: the Next.js app is the sun — everything orbits around it.

```
┌─────────────────────────────────────────────────────────────────────┐
│                         🌐  BROWSER (Client)                        │
│                                                                     │
│   React 19 + Redux Toolkit + Three.js Avatar + MediaPipe Face       │
│   ┌──────────┐ ┌──────────┐ ┌────────────┐ ┌────────────────────┐  │
│   │ Chat UI  │ │ Mood UI  │ │ Persona UI │ │  Live Talk (3D     │  │
│   │ Messages │ │ Chips    │ │ Selector   │ │  Avatar + Camera   │  │
│   │ Markdown │ │ Emotions │ │ 9 Roles    │ │  + Voice + Face)   │  │
│   └────┬─────┘ └────┬─────┘ └─────┬──────┘ └────────┬───────────┘  │
│        │            │              │                  │              │
│        └────────────┴──────────────┴──────────────────┘              │
│                              │ SSE / REST / Fetch                   │
└──────────────────────────────┼──────────────────────────────────────┘
                               │
               ┌───────────────▼───────────────────┐
               │      ☀️  NEXT.JS APP SERVER        │
               │      (API Routes + Middleware)     │
               │                                    │
               │  ┌──────────────────────────────┐  │
               │  │   /api/orchestrate           │  │
               │  │   Intent → Chat / Image gen  │  │
               │  ├──────────────────────────────┤  │
               │  │   /api/voice/*               │  │
               │  │   Proxy → Voice Service      │  │
               │  ├──────────────────────────────┤  │
               │  │   /api/create-order          │  │
               │  │   /api/verify-payment        │  │
               │  │   Razorpay Billing           │  │
               │  ├──────────────────────────────┤  │
               │  │   /api/conversations         │  │
               │  │   /api/profile               │  │
               │  │   /api/media                 │  │
               │  │   /api/check-subscription    │  │
               │  └──────────────────────────────┘  │
               │                                    │
               │  ┌──────────────────────────────┐  │
               │  │  NextAuth Middleware          │  │
               │  │  JWT Guard on all /chat,     │  │
               │  │  /live_talk, /premium, /api  │  │
               │  └──────────────────────────────┘  │
               └───┬────────────┬──────────────┬───┘
                   │            │              │
        ┌──────────▼──┐  ┌─────▼─────┐  ┌─────▼──────────┐
        │  MongoDB 7  │  │ Valkey    │  │ Voice Service  │
        │  (Mongoose)  │  │ (Redis)   │  │ (FastAPI :8001)│
        │             │  │ Session   │  │ STT + TTS      │
        │  Users      │  │ Cache     │  │ Sarvam / CF    │
        │  Convos     │  │ BullMQ    │  └────────────────┘
        │  Messages   │  │ Jobs      │
        │  MediaJobs  │  └───────────┘
        │  Subs       │
        │  VoiceMetric│
        └─────────────┘
```

### The Three Pillars

1. **Next.js Monolith** — The brain. Handles auth, chat orchestration, API routes, SSR pages, middleware, and everything web.
2. **Voice Service (FastAPI)** — The vocal cords. A Python sidecar that handles speech-to-text and text-to-speech, routing between Sarvam AI (for Indian languages) and Cloudflare Workers AI (for everything else).
3. **Data Layer (MongoDB + Valkey)** — The memory. MongoDB stores everything durable (users, conversations, subscriptions). Valkey (Redis-compatible) handles ephemeral state — session caches, job queues, and fast lookups.

---

## 🔄 Pipelines — How Data Flows

### 1. The Chat Pipeline

When a user sends a message, here's what happens — in under 3 seconds:

```
User types "Hey, I'm feeling stressed today"
        │
        ▼
┌─ /api/orchestrate ────────────────────────────────┐
│                                                   │
│  1. NextAuth middleware validates JWT              │
│  2. Parse message + load conversation history     │
│  3. Intent Router (regex, zero LLM cost):         │
│     ├─ "/image ..." → Image Generation Pipeline   │
│     └─ everything else → Chat Pipeline            │
│                                                   │
│  4. Build System Prompt:                          │
│     ├─ Base Persona (empathetic companion)        │
│     ├─ Role-Specific (Doctor/Comedian/Dev/...)    │
│     ├─ Mood Instruction (sad → gentle, validate)  │
│     ├─ Expression Hint (if face detected)         │
│     ├─ Style Rules (concise, no filler)           │
│     └─ Safety Guardrails (self-applied)           │
│                                                   │
│  5. Stream via CHAT_MODEL_CHAIN (4-deep fallback):│
│     ├─ Try: Cloudflare Llama 3.1 8B (~2s)        │
│     ├─ Try: Baidu CoBuddy (free OpenRouter)       │
│     ├─ Try: NVIDIA Nemotron 30B (free)            │
│     └─ Try: NVIDIA Nemotron 120B (last resort)    │
│                                                   │
│  6. Each model gets a 4s first-token deadline.    │
│     No token? Abort → next model. Automatic.      │
│                                                   │
│  7. Tokens stream as SSE → client renders live    │
│  8. Full response saved to MongoDB (Message doc)  │
└───────────────────────────────────────────────────┘
```

**Key design decision:** The old architecture used 4-5 sequential LLM calls (safety classifier → intent detector → sentiment analyzer → supervisor → agent). That took 10-15 seconds on free models. The current architecture collapses all of that into **one** system prompt with safety, persona, and mood baked in, plus a regex-based intent router. Result: **2-3 seconds end-to-end on the free tier.**

### 2. The Image Generation Pipeline

```
User types "/image a sunset over Mumbai skyline"
        │
        ▼
┌─ Intent Router ─────────────────────┐
│  Regex match: /image → "image"      │
│  Strip prefix → "a sunset over..."  │
└──────────┬──────────────────────────┘
           │
           ▼
┌─ generateImage() ───────────────────────────────┐
│                                                 │
│  Step 1: Cloudflare Workers AI                  │
│    Model: @cf/black-forest-labs/flux-1-schnell  │
│    POST prompt → returns base64 JPEG (~3-5s)    │
│                                                 │
│  Step 2: Decode base64 → Buffer                 │
│    Sanity check: reject < 1KB (malformed)       │
│                                                 │
│  Step 3: Upload to Cloudinary CDN               │
│    Returns permanent hosted URL (~1-2s)         │
│                                                 │
│  Total: ~5-8s (fits Vercel 10s Hobby limit)     │
└─────────────────────────────────────────────────┘
```

### 3. The Voice Pipeline (Live Talk)

The crown jewel. A real-time, bidirectional voice conversation with a 3D avatar:

```
┌─ Browser ────────────────────────────────────────────────┐
│                                                          │
│  📷 Camera → MediaPipe Face Landmarks (478 points)       │
│       │                                                  │
│       ├─ expressionMapper.ts → "smiling" / "frowning"    │
│       │   (maps AU distances to 5 emotion categories)    │
│       │                                                  │
│  🎤 Microphone → MediaRecorder (WebM/Opus)               │
│       │                                                  │
│       └─ POST audio blob → /api/voice/transcribe         │
│                    │                                     │
│                    ▼                                     │
│  ┌─ Voice Service (FastAPI :8001) ────────────────────┐  │
│  │                                                    │  │
│  │  JWT verification (signed by Next.js)              │  │
│  │  Quota check (daily voice-seconds limit)           │  │
│  │                                                    │  │
│  │  voice_router.py:                                  │  │
│  │  ├─ Indian language? → Sarvam saaras-v2 STT        │  │
│  │  └─ Other? → Cloudflare Whisper STT                │  │
│  │  (auto-fallback on failure)                        │  │
│  │                                                    │  │
│  │  Returns: { text, provider }                       │  │
│  └────────────────────────────────────────────────────┘  │
│                    │                                     │
│                    ▼                                     │
│  Text → /api/orchestrate (same chat pipeline)            │
│  + expression hint ("user is smiling") in system prompt  │
│                    │                                     │
│                    ▼                                     │
│  AI response text → POST /api/voice/synthesize           │
│                    │                                     │
│  ┌─ Voice Service ────────────────────────────────────┐  │
│  │  voice_router.py:                                  │  │
│  │  ├─ Indian language? → Sarvam bulbul-v3 TTS        │  │
│  │  │   (30+ speakers, natively Indian prosody)       │  │
│  │  └─ Other? → Cloudflare MeloTTS                    │  │
│  │                                                    │  │
│  │  Returns: audio/mpeg bytes                         │  │
│  └────────────────────────────────────────────────────┘  │
│                    │                                     │
│                    ▼                                     │
│  🔊 Audio plays in browser                               │
│  🧑‍🎤 3D Avatar animates lip-sync via Visemes              │
│     (Ready Player Me GLB + ARKit morph targets)          │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 4. The Payment Pipeline

```
User clicks "Go Premium"
        │
        ▼
  POST /api/create-order
  → Razorpay.orders.create({ amount, currency: INR })
  → Returns order_id
        │
        ▼
  Razorpay Checkout opens in browser
  User pays (UPI / Card / NetBanking)
        │
        ▼
  POST /api/verify-payment
  → HMAC-SHA256 signature verification
  → upgradeToPro(userId)
  → Subscription.tier = "pro"
  → Features unlocked (image gen, voice, avatar, agents)
  → Daily quotas set (50 images, 60 voice-minutes)
        │
        ▼
  🎉 PremiumSuccessPopup + confetti animation
```

---

## 🎭 The Persona System — 9 Distinct AI Characters

Spherial AI isn't one personality — it's **nine**. Each persona has its own voice style, system prompt, opening line, 3D avatar, and UI accent color:

| Persona | Emoji | Personality | Voice Style | Glow |
|---|---|---|---|---|
| **Friendly** | 🙂 | Warm, casual default companion | Warm Female | Indigo |
| **Humorous** | 😄 | Witty observations, light humor | Bright Playful | Amber |
| **Philosophical** | 🧠 | Socratic, exploratory | Calm Senior | Purple |
| **Romantic** | 💝 | Poetic, tender, attentive | Warm Female | Rose |
| **Motivational** | 💪 | Action-oriented, no filler | Confident Male | Teal |
| **Dr. Mehra** | 🩺 | Empathetic doctor (never diagnoses) | Calm Senior | Emerald |
| **Musician** | 🎵 | Creative, thinks in rhythm | Bright Playful | Purple |
| **Riz the Comedian** | 🎤 | Stand-up comic, callbacks | Bright Playful | Amber |
| **Senior Dev** | 👨‍💻 | Staff engineer, code-first | Confident Male | Cyan |

> **Safety note:** The Doctor persona requires explicit consent before use, displaying a medical disclaimer modal. It will *never* diagnose, *never* prescribe, and immediately directs to emergency services (102/911/999) for urgent symptoms.

---

## 🌍 External Services — The Ecosystem

Spherial AI integrates with a constellation of external services, each chosen for a specific reason:

### AI & Model Providers

| Service | Role | Why |
|---|---|---|
| **OpenRouter** | Primary LLM gateway | Routes to 100+ models. Free tier models. Single API key, multiple providers. |
| **Cloudflare Workers AI** | Chat fallback + Image Gen + STT/TTS | Owns rate limits (unlike shared OpenRouter pool). Flux-1-schnell for images. Whisper for STT. MeloTTS for non-Indian TTS. |
| **Sarvam AI** | Indian-language STT (saaras-v2) + TTS (bulbul-v3) | 11 Indian languages, 30+ native speakers, trained on Indian speech. Dramatically outperforms Whisper on Hindi-English code-mixed speech. |
| **NVIDIA NIM** (via OpenRouter) | Nemotron 30B & 120B models | Free, high-quality reasoning models. 30B for standard chat, 120B for deep reasoning. |
| **Google Gemini** (via OpenRouter) | Vision + Recommendations | Gemini-2.0-flash-exp for image classification and content suggestions. |
| **Pollinations.ai** | Backup image generation | Free, no-auth, deterministic image URLs. Kept as registry fallback. |

### Infrastructure Services

| Service | Role | Why |
|---|---|---|
| **MongoDB Atlas** | Primary database | Document store. 6 collections: Users, Conversations, Messages, MediaJobs, Subscriptions, VoiceMetrics. |
| **Valkey** (Redis-compatible) | Session cache + job queues | Drop-in Redis replacement. BullMQ background jobs. Voice session state caching. |
| **Upstash Redis** | Serverless session cache (optional) | REST-based Redis for edge deployments. Caches voice state so reconnects skip Mongo round-trips. Free: 10K commands/day. |

### Media & Content Services

| Service | Role | Why |
|---|---|---|
| **Cloudinary** | Image CDN + hosting | All AI-generated images are uploaded and served via Cloudinary. Free: 25GB storage + 25GB bandwidth/month. Permanent URLs, on-the-fly transforms. |
| **Ready Player Me** | 3D avatars | GLB models with ARKit morph targets for lip-sync. Each persona can have a custom avatar (doctor in white coat, dev with hoodie). |

### Authentication & Payments

| Service | Role | Why |
|---|---|---|
| **Google OAuth** | Social sign-in | One-click sign-in. `allowDangerousEmailAccountLinking` for seamless account merging. |
| **GitHub OAuth** | Social sign-in | Developer-friendly auth. Same account-linking behavior. |
| **Razorpay** | Payment gateway | Indian payment processor. UPI, cards, net banking. HMAC webhook verification for secure payment confirmation. |

### Communication & Observability

| Service | Role | Why |
|---|---|---|
| **Resend** | Transactional email | Welcome emails, receipts, notifications. Modern email API. |
| **LangSmith** | AI observability & tracing | Traces every agent trajectory, token usage, latency metrics across the full LLM pipeline. Debug production AI in real-time. |
| **Vercel Analytics** | Web analytics | Built-in performance and usage tracking. |

### Trend APIs (Optional)

| Service | Role |
|---|---|
| **NewsAPI** | Real-time news trends for contextual conversations |
| **YouTube API** | Video recommendations tied to user interests |
| **Spotify API** | Music taste discovery + playlist suggestions |

---

## 🗄️ Database Schema — The Data Model

```
┌─────────────┐       ┌──────────────────┐       ┌──────────────┐
│    User      │       │  Conversation    │       │   Message    │
├─────────────┤  1:N  ├──────────────────┤  1:N  ├──────────────┤
│ username     │──────▶│ userId           │──────▶│conversationId│
│ email        │       │ title            │       │ role (4)     │
│ password?    │       │ lastMood         │       │ content      │
│ googleId?    │       │ lastSentiment    │       │ parts[]      │
│ githubId?    │       │ agentRoute       │       │ trace{}      │
│ locale{}     │       │ pinned           │       │ tokenUsage{} │
│ preferences{}│       │ archivedAt       │       └──────────────┘
│ image        │       └──────────────────┘
└──────┬──────┘
       │
       │ 1:1    ┌──────────────────┐
       ├───────▶│  Subscription    │
       │        ├──────────────────┤
       │        │ tier (free/pro)  │
       │        │ status           │
       │        │ provider         │
       │        │ features{}       │
       │        │ quota{}          │
       │        │ consumedToday{}  │
       │        └──────────────────┘
       │
       │ 1:N    ┌──────────────────┐
       ├───────▶│   MediaJob       │
       │        ├──────────────────┤
       │        │ kind (image/meme)│
       │        │ status (5 states)│
       │        │ prompt           │
       │        │ modelId          │
       │        │ resultUrl        │
       │        │ locale{}         │
       │        └──────────────────┘
       │
       │ 1:N    ┌──────────────────┐
       └───────▶│  VoiceMetric     │
                ├──────────────────┤
                │ stt_ms           │
                │ ttft_ms          │
                │ llm_ms           │
                │ tts_ms           │
                │ total_ms         │
                │ provider_stt     │
                │ provider_tts     │
                │ persona          │
                │ locale           │
                │ expression       │
                └──────────────────┘
```

### Message Parts — Multimodal Content

Messages aren't just text. Each message has a `parts[]` array that can contain:

- `text` — Plain text content
- `image` — Generated image (linked to a MediaJob)
- `audio` — Voice recording with duration
- `card` — Rich content card (game, music, show recommendations)
- `tool-call` — Function call trace from the agent
- `tool-result` — Function call result

---

## 🔐 Security Architecture

### Zero-Trust API Design

```
Browser → NextAuth Middleware (JWT check on every protected route)
       → API Route Handler (session validation)
       → Database (server-side only, never exposed)
       → External APIs (server-to-server, keys never in browser)
```

- **No API keys in the browser.** All LLM calls, Cloudflare calls, Sarvam calls, and Razorpay calls happen server-side.
- **JWT-based auth everywhere.** The Next.js middleware intercepts all protected routes (`/chat`, `/live_talk`, `/premium`, `/api/*`) and validates the JWT before the request reaches the handler.
- **Voice service auth.** The FastAPI voice service requires a signed JWT (minted by Next.js) on every request. The JWT carries `userId` and `tier` — the voice service never touches the database directly.
- **HMAC webhook verification.** Razorpay payment confirmations are verified using SHA256 HMAC signatures before any subscription state is mutated.
- **Password security.** bcryptjs with salt for credential-based auth. Passwords are `select: false` in Mongoose — never returned in queries unless explicitly requested.

### Entitlement System

The `Entitlement` module is the **single source of truth** for what a user can do:

```typescript
Entitlement {
  tier: "free" | "pro"
  features: {
    imageGeneration:     boolean   // /image command access
    voiceConversational: boolean   // Live Talk voice mode
    advancedAgents:      boolean   // Complex reasoning models
    liveAvatar:          boolean   // 3D avatar in Live Talk
  }
  remaining: {
    imagesToday:        number    // Pro: 50/day
    voiceSecondsToday:  number    // Pro: 3,600s (60min)/day
  }
}
```

Daily quotas auto-reset at midnight. Expired subscriptions auto-downgrade to free tier.

---

## 🐳 Deployment — Docker Compose Stack

The entire system is containerized and orchestrated via Docker Compose:

```yaml
4 Services:
├── app          # Next.js production (standalone output, port 3000)
├── worker       # BullMQ background job processor
├── valkey       # Redis-compatible cache (8-alpine, ~30MB)
└── mongodb      # MongoDB 7 (persistent volume)
```

### Multi-Stage Docker Build (App)

```
Stage 1: deps     → npm ci (alpine, libc6-compat)
Stage 2: builder  → COPY + next build
Stage 3: runner   → Minimal image. Non-root user (nextjs:1001).
                    Only .next/standalone + .next/static + /public.
                    ~150MB final image.
```

Health checks ensure proper startup ordering — the app waits for both Valkey (`PONG` check) and MongoDB (`db.adminCommand('ping')`) before starting.

---

## 📱 Frontend Architecture — The UI Layer

### Page Structure

```
/                  → Landing page (Hero, Features, Pricing, Testimonials, CTA)
/signin            → Authentication (Google, GitHub, Email/Password)
/signup            → Registration
/chat              → Main chat interface (messages, mood chips, persona selector)
/live_talk         → Real-time voice + 3D avatar (premium)
/premium           → Subscription management + upgrade flow
/profile           → User settings + preferences
/images            → Generated image gallery
/feedback          → User feedback collection
/v2                → Next-gen UI experiments
```

### Component Architecture

```
src/components/
├── chatComponents/        # 14 components — the chat surface
│   ├── ChatInput.tsx      # Message composer + voice toggle + face toggle
│   ├── MessageBubble.tsx  # Rich message rendering (markdown, images, cards)
│   ├── MessageList.tsx    # Virtualized message list
│   ├── MoodChips.tsx      # Emotion selector (8 moods)
│   ├── PersonaSelector.tsx# 9-persona grid with glow accents
│   ├── VoiceMode.tsx      # Push-to-talk / continuous voice input
│   ├── LiveTalkOverlay.tsx# Full-screen voice session with 3D avatar
│   ├── LiveTalkTeaser.tsx # Premium upsell for live talk
│   ├── AgentTrace.tsx     # Debug view for agent routing
│   ├── FaceToggle.tsx     # Camera on/off for face detection
│   ├── MultimodalPart.tsx # Renders image/audio/card message parts
│   ├── UsageMeter.tsx     # Daily quota visualization
│   ├── EmptyState.tsx     # First-time user experience
│   └── ChatNavbar.tsx     # Conversation header + controls
├── avatar/                # 3D avatar rendering
│   ├── AvatarRenderer.tsx # Three.js scene + RPM model loader
│   └── AvatarErrorBoundary.tsx
├── livetalk/              # Live talk UI
│   ├── MeetView.tsx       # Google Meet-style layout
│   ├── StageGrid.tsx      # Avatar + user camera grid
│   ├── BottomBar.tsx      # Mic, camera, end call controls
│   ├── SidePanel.tsx      # Chat transcript sidebar
│   ├── OnboardingWizard.tsx # 6-step setup wizard
│   ├── UserCameraTile.tsx # Self-view with face landmarks overlay
│   ├── ReconnectOverlay.tsx # Automatic reconnection UI
│   ├── ResumeManager.tsx  # Session resume on page refresh
│   └── DoctorConsentModal.tsx # Medical disclaimer for Dr. Mehra
├── shell/                 # App shell (sidebar, nav)
├── profile/               # Profile settings UI
├── ui/                    # Shadcn/ui base components
├── magicui/               # Animated UI effects
└── providers/             # React context providers
```

### State Management (Redux Slices)

```
store/
├── chatSlice.ts     # Active conversation, message state
├── personaSlice.ts  # Selected persona + preferences
├── voiceSlice.ts    # Voice mode state (recording, playing, provider)
├── localeSlice.ts   # Language, region, timezone
└── premiumSlice.ts  # Subscription tier, features, quotas
```

---

## 🧠 The Provider Registry — Policy-Driven Model Routing

One of the most elegant parts of the architecture. Instead of hardcoding model names everywhere, Spherial AI has a **centralized model registry** that maps logical tasks to concrete models:

```
10 Task Types → 3 Variants Each (primary / fast / cheap)

supervisor          → Nemotron 30B (routing decisions)
sentiment           → Nemotron 30B (emotion classification)
intent              → Nemotron 30B (what does the user want?)
safety              → Nemotron 30B (content moderation)
recommendation      → Gemini 2.0 Flash (content suggestions)
chat_standard       → Nemotron 30B (conversational core)
chat_complex        → Nemotron 120B (deep reasoning)
image_generation    → Pollinations Flux / Turbo
image_classification→ Gemini 2.0 Flash (vision)
voice_tts           → OpenAI TTS-1-HD (pro) / Gemini (free)
voice_stt           → Gemini 2.0 Flash (pro)
```

The `routeModel()` function picks the right variant based on a **RoutingPolicy**:

```typescript
routeModel("chat_standard", {
  maxCostUsd: 0,           // Must be free
  maxLatencyMs: 3000,      // Under 3 seconds
  requiresPremium: false    // Available to free users
})
→ Returns the "cheap" variant (free-tier Nemotron 30B)
```

This means **swapping an AI provider is a one-line registry edit** — zero changes to business logic.

---

## 🗣️ Multilingual Voice — 11 Indian Languages

The voice service supports **11 Indian languages** out of the box, with automatic provider routing:

| Language | Code | STT Provider | TTS Provider |
|---|---|---|---|
| Hindi | hi-IN | Sarvam saaras-v2 | Sarvam bulbul-v3 |
| Tamil | ta-IN | Sarvam saaras-v2 | Sarvam bulbul-v3 |
| Telugu | te-IN | Sarvam saaras-v2 | Sarvam bulbul-v3 |
| Bengali | bn-IN | Sarvam saaras-v2 | Sarvam bulbul-v3 |
| Marathi | mr-IN | Sarvam saaras-v2 | Sarvam bulbul-v3 |
| Gujarati | gu-IN | Sarvam saaras-v2 | Sarvam bulbul-v3 |
| Kannada | kn-IN | Sarvam saaras-v2 | Sarvam bulbul-v3 |
| Malayalam | ml-IN | Sarvam saaras-v2 | Sarvam bulbul-v3 |
| Punjabi | pa-IN | Sarvam saaras-v2 | Sarvam bulbul-v3 |
| Odia | od-IN | Sarvam saaras-v2 | Sarvam bulbul-v3 |
| English (India) | en-IN | Sarvam saaras-v2 | Sarvam bulbul-v3 |
| English (US/UK) | en-US/GB | Cloudflare Whisper | Cloudflare MeloTTS |

**Automatic fallback:** If Sarvam is down or not configured, the voice router silently falls back to Cloudflare — the user always gets *some* voice, even if the accent isn't native.

---

## 🔮 What's Coming Next — The Roadmap

### Phase 3: Deep Multilingual Intelligence
- **WebSocket streaming** for Sarvam voice (sub-500ms latency)
- **Server-side MediaPipe** for GPU-accelerated face analysis
- **Language-aware persona switching** (Dr. Mehra speaks Hindi natively in India)

### Phase 3.5: Operational Maturity
- **Redis-backed quota tracking** for Sarvam API usage
- **Admin dashboard** for moderation event review
- **A/B testing** for persona prompt variants

### Future Expansions
- **More AI providers** — Google TTS Neural2, ElevenLabs for premium voice quality
- **Custom avatars** — Per-persona Ready Player Me models (doctor in white coat, dev in hoodie)
- **Trend-aware conversations** — NewsAPI + YouTube + Spotify integration for contextual, timely chat
- **Voice emotion detection** — Analyze *how* the user speaks, not just *what* they say
- **Group conversations** — Multiple AI personas in a single room
- **Mobile app** — React Native wrapper for iOS/Android

---

## 📊 By The Numbers

| Metric | Value |
|---|---|
| **Languages** | TypeScript + Python |
| **Total source files** | ~80+ across 2 services |
| **Mongoose models** | 6 (User, Conversation, Message, MediaJob, Subscription, VoiceMetric) |
| **API routes** | 11 (auth, orchestrate, voice, media, conversations, profile, billing) |
| **AI personas** | 9 distinct characters |
| **Supported languages** | 11 Indian + 6 international |
| **Model fallback depth** | 4-model chain with deadline-based failover |
| **Chat latency** | 2-3s first token (free tier) |
| **Image generation** | 5-8s end-to-end |
| **Docker services** | 4 (app, worker, valkey, mongodb) |
| **External service integrations** | 15+ |

---

> *Spherial AI isn't just a project — it's the belief that AI should feel less like software and more like a presence. Every technical decision, from the 4-model fallback chain to the expression-aware system prompts, serves one goal: making the machine disappear so the friendship feels real.*

---

<p align="center"><em>Built with ❤️ by Mohd Shubair · 2026</em></p>
