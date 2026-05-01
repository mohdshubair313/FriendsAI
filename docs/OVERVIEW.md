# Friends AI — Full Architecture & Tooling Overview

A plain-English walkthrough of what your app is, what's in it, why each piece is there, and how the whole thing fits together.

---

## 1. The big picture

Friends AI is a **multimodal agentic companion**. Users chat with it like ChatGPT, but underneath there's a small "team of AI specialists" deciding *who* should answer (a chat agent, an image generator, a voice agent, etc.) and *how* (with what tone). You also have a premium tier, voice mode, image generation, and a live talk feature.

Three big ideas drive everything:

| Idea | Why |
|---|---|
| **Stream the answer in real time** | So users see the reply appearing word-by-word instead of waiting 30 seconds for a wall of text. |
| **Route smartly** — fast path for "hi", full graph for hard questions | So small talk feels instant and complex requests get the full reasoning pipeline. |
| **Separate the heavy work from the chat request** | Image generation runs in a background worker so the chat reply isn't blocked. |

---

## 2. The tech stack — what each tool does and why it's there

### Frontend

| Tool | Role | Why this one |
|---|---|---|
| **Next.js 16 (App Router)** | The whole framework — pages, API routes, SSR | One framework for both UI and backend, no separate Express server, deploys easily to Vercel. |
| **React 19** | UI library | Standard for Next, brings native streaming + transitions. |
| **TypeScript** | Type-checked JavaScript | Catches bugs at write-time, especially around AI message shapes. |
| **Tailwind CSS 3.4** | Styling utility classes | No CSS files, no naming bikeshed, every style is right next to the markup. |
| **Framer Motion** | Animations | Spring physics, scroll-linked transitions, easy `AnimatePresence` for entering/leaving. |
| **React Three Fiber + drei + three.js** | The WebGL particle hero on `/v2` | A 5,200-point reactive torus is what makes the landing feel premium. |
| **Lucide-react** | Icons | Tree-shakeable, consistent style. |
| **Redux Toolkit + react-redux** | Client state (mood + premium status) | We need a few values shared across many components — Redux is overkill for most apps but fine for this. |
| **NextAuth.js** | Sign-in (Google, GitHub, email/password) | Industry-standard, sessions stored as JWTs, plugs straight into Next App Router. |
| **next/font (Geist + Instrument Serif)** | Self-hosted fonts | No layout shift, no Google Fonts CDN, automatically optimized. |
| **react-markdown + remark-gfm + rehype-raw** | Rendering AI markdown replies | AI returns markdown — these turn it into proper headings, lists, tables, code blocks. |
| **Sonner** | Toast notifications | Lightweight, themeable. |
| **Razorpay (NEXT_PUBLIC_RAZORPAY_KEY_ID)** | Payments (INR) | India-friendly payment gateway for the Pro upgrade flow. |

### Backend / AI

| Tool | Role | Why this one |
|---|---|---|
| **LangChain + LangGraph** | Builds the "agent graph" — the team of specialists | LangGraph models AI workflows as a state machine: nodes (safety, intent, supervisor, buddy, image…) connected by edges. Easy to reason about and extend. |
| **OpenRouter API** | Single gateway to many LLMs (Llama, Nemotron, Minimax, Flux for images) | One API key for many models; free tiers exist for prototyping. |
| **Zod** | Runtime validation of inputs and AI structured outputs | API requests, mood values, JSON returned by LLMs — all validated. |
| **MongoDB + Mongoose** | Persistent data (users, conversations, jobs, subscriptions) | Document model fits the messy shape of chat history + agent metadata better than SQL. |
| **BullMQ + Valkey** | Background job queue (image generation jobs run there) | We don't want a 5-second image API to block a chat reply. Valkey is the open-source Redis fork; same protocol, no licensing risk. |
| **NextAuth JWT + middleware** | Route protection | One file (`src/middleware.ts`) decides which paths require login. |

### Dev/ops

| Tool | Role |
|---|---|
| **Docker + docker-compose** | One command (`docker compose up`) brings up app, worker, MongoDB, Valkey together for local development. |
| **Standalone Next.js output** | Production Docker images are tiny because Next traces only the files actually used. |
| **Healthchecks** in compose | App and worker wait for MongoDB/Valkey to *actually be ready* (not just started). |

---

## 3. The agent graph — how a chat reply is actually produced

When a user sends a message, here's the pipeline. There are **two paths** depending on the message:

### Fast path (for "hi", "thanks", "who are you", short greetings)

```
User: "hi"
  │
  ▼
Route detects: message is < 80 chars + matches greeting regex
  │
  ▼
Skip the whole graph — call BuddyAgent directly with streaming
  │
  ▼
Tokens stream to client over Server-Sent Events (~1-2 s to first token)
```

This single optimization took small-talk replies from **37 s → 1-2 s** because we used to run 5 LLM calls for "hi" (safety + intent + sentiment + supervisor + buddy).

### Slow path (for everything else)

```
START
  │
  ▼
Preprocess  ←—— runs Safety AND Intent in PARALLEL (Promise.all)
  │           Safety: is the message harmful? Block early if yes.
  │           Intent: is this casual chat / advice / image / recommendation?
  │
  ▼
Sentiment   ←—— SKIPPED if user already picked a mood
  │           Otherwise infers user's emotional state, normalizes to one of 8 moods
  │
  ▼
Supervisor  ←—— LLM that decides: should this go to the buddy, image gen, voice, or recommendations?
  │
  ▼
EntitlementGate ←—— blocks Pro features for free users
  │
  ▼
One of:
  ├── BuddyAgent       (chat)        → streams tokens
  ├── ImageGeneration  (/image …)    → enqueues a background job
  ├── Voice
  ├── AvatarSession
  └── Recommendation
  │
  ▼
Persistence ←—— saves the message to the conversation in MongoDB
  │
  ▼
END
```

**Three smart things that save time and cost:**

1. **Safety + Intent in parallel** — they don't depend on each other, so we run them at the same time. Saves 3-5 seconds.
2. **Sentiment skipped when user picked mood** — if you clicked the "Sad" chip, we don't burn an LLM call to detect that you're sad. Saves another 3-5 seconds.
3. **Hybrid mood resolution in BuddyAgent** — "User pick wins → AI-detected wins → default friendly". So the user always has the override switch, but the AI adapts when they don't care.

### Streaming + abort

The route returns a **ReadableStream** (Server-Sent Events). Every chunk sent is one of:

```
{ type: "start", mode: "fast" | "graph" }   ← UI can show "thinking…" pulse
{ type: "conversation", id: "..." }          ← server minted a Conversation, client stores id
{ type: "token", content: "Hello" }          ← one chunk of the reply
{ type: "done" }                             ← stream finished
{ type: "aborted" }                          ← user clicked Stop
```

Client uses `AbortController` so the **Stop button actually cancels the LLM call**, not just hides the UI.

---

## 4. The data model — what's in MongoDB

| Collection | Holds | Why it exists |
|---|---|---|
| **users** | username, email, image, OAuth IDs, locale, preferences | Single source of truth per user. |
| **conversations** | userId, title, last mood/sentiment, agent route | One row per chat thread; linked to messages and media jobs. |
| **messages** | conversationId, role (user/assistant), content, multimodal parts, agent trace | Every turn stored — for history, persistence, future RAG. |
| **subscriptions** | userId, tier (free/pro), Razorpay info, expiry | Deprecated `isPremium` boolean on user is being replaced by this proper subscription doc. |
| **mediajobs** | userId, conversationId, kind (image/meme), prompt, status, locale, error | Background image jobs — status updated by the worker as they progress. |
| **avatarsessions** | Live talk session state | For the WebRTC live-avatar feature. |
| **voicesessions** | TTS/STT job records | Voice usage tracking. |
| **emotionevents** | sentiment events over time | Analytics + adaptive persona. |
| **moderationevents** | safety blocks | Audit trail. |
| **providerusagelogs** | LLM token + cost per call | Cost accounting and quotas. |
| **userpreferences** | locale (`en-US`), voice preference, consent flags | Read by the image node to know what country to localize generated images for. |

---

## 5. The frontend pages

### `/chat` — main chat surface

- Top: **ChatNavbar** with brand, online indicator, Pro/Upgrade pill, and a clickable profile avatar.
- Middle: **MessageList** — Claude-style. User bubbles right-aligned indigo pills. AI replies flush left with an avatar pill (no bubble background — easier to read long answers).
- Right above input: **MoodChips** — pick a mood ("Sad", "Funny", "Auto", etc.) that overrides AI sentiment detection.
- Bottom: **ChatInput** — auto-expanding textarea, attachment button, image-mode toggle, mic button (premium), magnetic send button that becomes a Stop button while streaming.
- Hover any AI reply: **Read-Aloud + Copy** buttons appear. Read-Aloud uses browser SpeechSynthesis (markdown stripped before speaking).
- **Typing indicator** appears only on slow path (graph mode), never on fast path — that way fast replies don't show fake "thinking…" delay.

### `/v2` and `/v2/chat` — premium "Awwwards" landing + chat

A whole second design system, parallel to the main app. WebGL hero (R3F particle torus), bento-box features grid, glassmorphism panels, aurora gradient glows, magnetic buttons. Built so we can A/B-test the new design without disturbing the working `/chat`.

### `/profile` — account hub

- Identity card: avatar, name, email, plan badge, joined date, Upgrade CTA if free.
- Subscription card: plan + status, per-feature checklist (image gen, voice, advanced agents, live avatar) showing what's enabled, daily usage counters for free users.
- Account card: user ID, sign-in providers (Google/GitHub/Email chips), onboarding date.
- Preferences: country, language, timezone, default persona, TTS voice.
- Account actions: Back to chat, See Pro plans, Sign out.

### `/live_talk` — full-screen voice mode (Pro)

- Real microphone capture via `getUserMedia` → `AnalyserNode` → audio level drives the waveform.
- `SpeechRecognition` (continuous) sends final transcripts to `/api/orchestrate`.
- Streaming reply tokens are accumulated into sentences and pushed to a `SpeechSynthesisUtterance` queue, so the AI starts speaking mid-reply (smoother than waiting for the full message).
- Interrupt button: cancels speech + queue + HTTP stream + recognition restart.

### `/premium`

Razorpay checkout for upgrading to Pro.

### `/signin`, `/signup`

NextAuth-driven. Supports Google, GitHub, and email/password.

---

## 6. How a single user message flows end-to-end

```
1. User types "I had a really bad day" in ChatInput
2. handleSubmit fires → adds user message + empty assistant placeholder to state
3. AbortController created → stored in ref so Stop button can cancel
4. POST /api/orchestrate with { messages, mood, conversationId }
   ├─ Middleware checks JWT; redirects to /signin if missing
   └─ Route mints a Conversation if first turn; emits SSE { type: "conversation", id }
5. Route checks fast-path regex → fails → enters slow path
6. ReadableStream begins; emits { type: "start", mode: "graph" }
7. Graph runs:
   ├─ Preprocess (safety + intent in parallel) → safe + "seek_advice"
   ├─ Sentiment → detects "sad" → state.detectedMood = "sad"
   ├─ Supervisor → routes to "buddy"
   ├─ EntitlementGate → passes (chat is free)
   └─ BuddyAgent
       ├─ Reads streamWriter from config
       ├─ resolveMood() picks user > detected > default
       ├─ Calls Minimax via OpenRouter with llm.stream()
       └─ For each token: writer({ type: "token", content: token })
8. Each SSE chunk arrives at the client
9. Client parses the JSON, accumulates content, updates the assistant message in state
10. React re-renders the bubble with new content (streaming caret)
11. PersistenceNode saves the full message to MongoDB
12. SSE { type: "done" } → client sets isLoading=false, Stop button becomes Send
```

Total time on free OpenRouter: ~20-25s for slow path, ~1-2s first token for fast path.

---

## 7. The Docker stack

```
┌─────────────────────────────────────────────────────────────┐
│  Host (Windows)                                             │
│                                                             │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐  ┌──────────┐ │
│  │  app     │   │  worker  │   │ mongodb  │  │  valkey  │ │
│  │  :3000   │   │  (BullMQ │   │  :27017  │  │  :6379   │ │
│  │          │   │  consumer│   │          │  │          │ │
│  │  Next.js │   │   )      │   │  data:   │  │  data:   │ │
│  │  standa- │   │          │   │  volume  │  │  volume  │ │
│  │  lone    │   │          │   │          │  │          │ │
│  └─────┬────┘   └─────┬────┘   └─────┬────┘  └─────┬────┘ │
│        │              │              │             │       │
│        └──────────────┴──── friends-net ────────────┘      │
│                                                             │
│  Healthchecks ensure app+worker wait for mongo+valkey       │
│  before starting.                                           │
└─────────────────────────────────────────────────────────────┘
```

- **app** runs the Next.js production server (standalone build).
- **worker** runs `tsx src/worker.ts` — a BullMQ consumer that drains the `media-generation` queue and processes image jobs.
- **mongodb** stores users, conversations, jobs, subscriptions.
- **valkey** is the BullMQ broker (job queues live here).

When a user types `/image cat`, the chat route:
1. Creates a `MediaJob` document in MongoDB (status: queued).
2. Enqueues a job in Valkey.
3. Replies immediately: "On it — generating your image now."

The worker:
1. Picks up the job from Valkey.
2. Calls the image provider (Flux on OpenRouter).
3. Updates the MediaJob to `succeeded` with the resulting URL.

The chat UI can poll `/api/media/status/[jobId]` to know when it's done.

---

## 8. The improvements you've made (in order)

### Phase 1 — Plumbing
- **Streaming**: Switched `/api/orchestrate` from a 30-second blocking JSON response to Server-Sent Events. Tokens appear as they're generated.
- **Stop button**: Added `AbortController` end-to-end so clicking Stop actually cancels the LLM call, not just hides the spinner.
- **Zod safety bug**: Fixed a `.optional()` schema that OpenAI's structured-output validator rejected — safety was silently no-op'ing for weeks.

### Phase 2 — Speed
- **Fast path**: Added regex-based detection for greetings → calls BuddyAgent directly, skipping safety+intent+sentiment+supervisor. "hi" went from 37s to 1-2s.
- **Mood hybrid**: User-picked mood always wins; AI-detected mood is fallback when user is on Auto. Sentiment node now skips its LLM call entirely when the user already picked.
- **Persona node removed** from graph — was injecting a duplicate system prompt and causing message duplication via the concat reducer.

### Phase 3 — Polish
- **Parallel preprocess**: Safety and Intent now run via `Promise.all`. Slow path got 3-5s faster.
- **Branding cleanup**: All 10 user-visible "Spherial" strings flipped to "Friends AI". Dead `personaNode.ts` file deleted.
- **MessageBubble redesign**: Claude-style — user bubble right, AI message flush left. Read-Aloud + Copy buttons that actually work.
- **Typing indicator** that knows the mode: shown for graph, hidden for fast path.
- **VoiceMode TTS bug**: Was speaking each token of the streaming reply as a separate utterance (50+ duplicates per message). Fixed with a `lastSpokenRef` that de-dupes by exact text.
- **LiveTalk rewire**: Replaced the fully-mocked overlay with real mic capture + speech recognition + sentence-queued TTS. Interrupt button actually cancels speech.
- **Image generation fix**: Auto-mints a Conversation document on the first turn (so MediaJob's required `conversationId` foreign key is satisfied), defaults `locale.country` to `"US"` if no preferences row.
- **Profile page** at `/profile` with avatar, plan, features, account info, sign out.
- **Sidebar avatar**: now renders the real user image (Google/GitHub avatar) with initials fallback.
- **ChatNavbar avatar button**: 32px circular avatar in the top-right of the chat — links to `/profile`. Shows a tiny crown if Pro.

### Phase 4 — Infra
- **Queue resilience**: Wrapped `enqueueImageGeneration` in `Promise.race` with a 5s timeout. If Valkey is unreachable, MediaJob is marked failed and the user gets a clear message instead of an infinite hang.
- **Redis client config**: `connectTimeout: 5000`, `retryStrategy` capped at 3, single warning on `ECONNREFUSED` (was spamming infinite `AggregateError`s).
- **Docker compose**: Pinned `valkey/valkey:8-alpine` and `mongo:7`. Added healthchecks. Containers wait for `service_healthy` before starting. Named bridge network. Container names rebranded to `friends-ai-*`.

---

## 9. Why all this matters (simple version)

Without these improvements:
- A "hi" took 30+ seconds → users would think the app is broken.
- The Stop button was decorative.
- Users couldn't see the reply forming → felt slow even when it was streaming somewhere.
- Image generation crashed silently if Valkey wasn't running.
- The UI said "Spherial" in some places and "Friends AI" in others.
- The voice mode would speak each token as its own broken sentence.
- There was no profile page so users couldn't see their plan or sign out cleanly.

With them:
- Greetings feel instant. Hard questions show a real "thinking…" indicator while the graph runs.
- Stop actually stops.
- Image generation either works or fails fast with a clear message.
- Voice mode speaks one clean sentence per reply.
- Profile, navbar avatar, sidebar — all show the user's real picture and plan.
- Local dev is `docker compose up` and everything just runs.

---

## 10. The mental model

Think of it like a **restaurant**:

- **Frontend (Next.js + React)** is the dining room — what the customer sees and interacts with.
- **Middleware** is the bouncer at the door — checks if you're allowed in.
- **API routes** are the waiters — they take orders and bring them to the kitchen.
- **LangGraph agent graph** is the kitchen brigade — multiple chefs (safety, intent, supervisor, buddy, image, voice) collaborating on each order.
- **OpenRouter / LLM providers** are the gas burners — they do the actual cooking but cost money per use.
- **Valkey + BullMQ + Worker** is the prep kitchen — slow heavy work (image gen) happens there so the main kitchen stays fast.
- **MongoDB** is the storeroom — records of every customer, every order, every payment.
- **Docker Compose** is the building itself — bricks and mortar so the whole restaurant exists somewhere consistent.

Every choice in this stack is about getting the right balance of: **fast for users, cheap for you, and easy enough to keep building on**.
