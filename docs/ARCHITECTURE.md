# Spherial AI Agentic Pipeline Architecture

## The Complete Journey: From "Hi" to AI Response

### 📱 User Sends Message: "Hi"

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                        USER'S JOURNEY STARTS                                  │
│                                                                            │
│    👤 User types "Hi" in chat box                                          │
│         │                                                                  │
│         ▼                                                                  │
│    📤 POST /api/orchestrate                                                │
│         │                                                                  │
│         Body: {                                                            │
│           "messages": [{"role": "user", "content": "Hi"}],                  │
│           "mood": "friendly"                                               │
│         }                                                                  │
└─────────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
```

---

## 🔄 Step 1: Request Validation

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                    STEP 1: AUTH & VALIDATION                                │
│                                                                            │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐             │
│  │   NextAuth   │────▶│   Token    │────▶│  Zod Schema │             │
│  │   JWT Check │     │  Verify   │     │ Validation │             │
│  └──────────────┘     └──────────────┘     └──────────────┘             │
│       │                     │                   │                           │
│       │              Extract User ID    Validate Request                │
│       │                     │                   │                           │
│       ▼                     ▼                   ▼                           │
│  ┌──────────────────────────────────────────┐                         │
│  │  if invalid → 401/400 Error Response       │                         │
│  │  if valid  → Continue Pipeline           │                         │
│  └──────────────────────────────────────────┘                         │
└───────────────────────────────────────────────────────────────────���─────────┘
```

**What happens:**
1. NextAuth verifies the session token
2. Extracts user ID (`69edece6eb6cb7880447c4ed`)
3. Checks if user is Pro/Free tier
4. Validates message format with Zod schema

---

## 🔄 Step 2: Message Conversion

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│               STEP 2: CONVERT TO LANGCHAIN MESSAGES                         │
│                                                                            │
│  Input:                           LangChain Messages:                          │
│  ┌─────────────────┐            ┌─────────────────────┐                 │
│  │ {               │    ──────▶  │ HumanMessage({       │                 │
│  │   "role": "user",│            │   content: "Hi"     │                 │
│  │   "content": "Hi"│            │ })                  │                 │
│  │ }               │            └─────────────────────┘                 │
│  └─────────────────┘                                                       │
│                                                                            │
│  Also sanitizes input:                                                      │
│  • Removes <script> tags                                                    │
│  • Removes javascript: URLs                                               │
│  • Removes onClick= handlers                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Step 3: Check User Entitlement

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                  STEP 3: ENTITLEMENT CHECK                                    │
│                                                                            │
│  ┌──────────────────────────────────────────────┐                           │
│  │         getEntitlement(userId)               │                           │
│  └──────────────────────────────────────────────┘                           │
│                       │                                                    │
│                       ▼                                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                           │
│  │   Free     │  │   Pro      │  │  Enterprise│                           │
│  │  User     │  │   User    │  │    User   │                           │
│  └─────────────┘  └─────────────┘  └─────────────┘                           │
│       │               │               │                                       │
│       ▼               ▼               ���                                       │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐                               │
│  │Features:│   │Features: │   │Features: │                               │
│  │• Chat   │   │• All +   │   │• All +   │                               │
│  │• 8 Moods│   │• Images  │   │• Live   │                               │
│  │         │   │• Voice  │   │• Voice  │                               │
│  │         │   │• Live   │   │• Live   │                               │
│  │         │   │• Avatar │   │• Avatar │                               │
│  └──────────┘   └──────────┘   └──────────┘                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🧠 THE HEART: LangGraph Agent Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                    LANGGRAPH AGENT PIPELINE                                      │
│                                                                            │
│    ┌─────────┐                                                            │
│    │  START  │                                                            │
│    └────┬────┘                                                            │
│         │                                                                  │
│         ▼                                                                 │
│  ┌──────────────────────────────────────────────────────┐                 │
│  │  1️⃣  SAFETY NODE (Guardrails)                         │                 │
│  │  • Check for harmful content                        │                 │
│  │  • XSS, injection, violence detection         │                 │
│  │  • Uses: Gemini-2.0-flash                    │                 │
│  └────────────────────┬───────────────────────┘                 │
│                       │                                                   │
│         isSafe? ─────┘                                                   │
│          │                                                                │
│    Yes   │   No                                                           │
│    ┌────┴────┐     ┌────────────────────────────────┐                    │
│    ▼        │     │ BLOCK RESPONSE                  │                    │
│  ┌──────┐   │     │ "Cannot fulfill request"        │                    │
│  │ 2️⃣  │   │     └────────────────────────────────┘                    │
│  │INTENT│   │                                                              │
│  │NODE │   │                                                              │
│  │     │   │     ┌────────────────────────────���─���─────────┐                  │
│  │     │   │     │ Returns next:                      │                  │
│  │• Casual Chat │   │ • casual_chat → buddy         │                  │
│  │• Generate │    │ • generate_image → visual    │                  │
│  │• Advice  │      │ • recommendation → recco   │                    │
│  │• Recommend│      └───────────────────────────────┘                  │
│  └──────┬───┘    │                                                      │
│         │        │                                                      │
│         ▼        ▼                                                      │
│  ┌──────────────────────────────────────────────┐                      │
│  │ 3️⃣  SENTIMENT NODE                          │                      │
│  │  • Detects emotion (-1 to 1)                │                      │
│  │  • Arousal level (0 to 1)                  │                      │
│  │  • Mood detection                         │                      │
│  └���───────────────────┬───────────────────────┘                      │
│                       │                                                  │
│                       ▼                                                  │
│  ┌──────────────────────────────────────────────┐                      │
│  │ 4️⃣  PERSONA INJECTOR                        │                      │
│  │  • Adds system personality context          │                      │
│  │  • "Empathetic, intellectual, playful"     │                      │
│  └────────────────────┬───────────────────────┘                      │
│                       │                                                  │
│                       ▼                                                  │
│  ┌──────────────────────────────────────────────┐                      │
│  │ 5️⃣  SUPERVISOR (Router)                     │                      │
│  │  • Decides which agent to call              │                      │
│  │  • Uses structured output (Zod)          │                      │
│  │  • Routes: buddy/visual/recommendation      │                      │
│  └────────────────────┬───────────────────────┘                      │
│                       │                                                  │
│         next ─────────┘                                                   │
│          │                                                              │
│    buddy ◀────┤ visual ◀── recommendation                                │
│    ┌────┐   ┌─────┐     ┌───────────┐                                │
│    ▼    │   ▼     │         ▼                                         │
│  ┌──────┐┌───────┐┌─────────────┐                                    │
│  │ 6️⃣  ││ 7️⃣   ││ 8️⃣          │                                    │
│  │BUDDY ││IMAGE ││ RECOMMEND    │                                    │
│  │AGENT ││GEN   ││  NODE      │                                    │
│  │     ││      ││            │                                    │
│  │     ││      ││            │                                    │
│  └──┬──┘└──┬───┘└─────┬─────┘                                    │
│     │        │          │                                             │
│     └────────┴──────────┘  (All return to Persistence)                │
│                              │                                      │
│                              ▼                                      │
│  ┌──────────────────────────────────────────────┐                      │
│  │ 9️⃣  PERSISTENCE NODE                     │                      │
│  │  • Save to MongoDB                       │                      │
│  │  • Log token usage                     │                      │
│  │  • Store conversation                 │                      │
│  └────────────────────┬──���─���──────────────┘                      │
│                       │                                                  │
│                       ▼                                                  │
│    ┌─────────┐                                                            │
│    │  END   │                                                             │
│    └─────────┘                                                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🤖 Which Models Are Used?

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                      MODEL ROUTING REGISTRY                                  │
│                                                                            │
│  ┌───────────────────────────────────────────────────────────────────┐    │
│  │  Task           │  Primary Model        │  Fallback Model         │    │
│  ├────────────────┼───────────────────────┼─────────────────────────┤    │
│  │  Safety        │  Gemini-2.0-flash     │  Basic Filter          │    │
│  │  Intent        │  Gemini-2.0-flash     │  Keyword Matcher      │    │
│  │  Sentiment     │  Gemini-2.0-flash     │  None                 │    │
│  │  Supervisor    │  Gemini-2.0-flash     │  Gemma-2-9b           │    │
│  │  Chat (Buddy)  │  Gemini-2.0-flash     │  Llama-3-70b          │    │
│  │  Image Gen    │  Flux-Pro (OpenRouter)│  SDXL-Turbo           │    │
│  │  Voice TTS    │  OpenAI-TTS-1-HD      │  Gemini (fallback)    │    │
│  │  Voice STT    │  Gemini-2.0-flash     │  Gemini (fallback)    │    │
│  └───────────────────────────────────────────────────────────────────┘    │
│                                                                            │
│  Provider Priority:                                                       │
│  1. Google (Gemini) - Primary                                            │
│  2. OpenRouter - Fallback/Alternative                                    │
│  3. NVIDIA - Vision tasks                                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Tools & Libraries Used

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                     TECHNOLOGY STACK                                       │
├───────────────────────────────────────────────────────────────────────────���─���┬──────────┤
│  Layer                  │  Technology                │  Purpose          ├──────────┤
├────────────────────────┼──────────────────────────────┼──────────────────┼──────────┤
│  Frontend              │  Next.js 16 + React 19     │  UI Framework    │          │
│  UI Components        │  Framer Motion            │  Animations     │          │
│  State Management     │  Redux Toolkit           │  Global State   │          │
│  Auth                 │  NextAuth.js              │  JWT Sessions   │          │
├────────────────────────┼──────────────────────────────┼──────────────────┼──────────┤
│  AI/ML Integration    │  Vercel AI SDK            │  Chat Interface │          │
│  LLM Clients         │  LangChain               │  AI Pipeline    │          │
│  Agent Orchestration  │  LangGraph              │  State Machine │          │
│  Structured Output   │  Zod                    │  Type Safety   │          │
├────────────────────────┼──────────────────────────────┼──────────────────┼──────────┤
│  Backend              │  Next.js API Routes       │  API Endpoints  │          │
│  Database            │  MongoDB + Mongoose     │  Persistence    │          │
│  Queue               │  BullMQ + Redis         │  Async Jobs     │          │
│  Realtime            │  WebSocket             │  Voice Stream   │          │
│  Payments           │  Razorpay              │  Subscriptions  │          │
│  Email              │  Resend                │  Notifications  │          │
└──────────────────────────────────────────────────────────────────────────────┴──────────┘
```

---

## 🔄 Complete Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                      COMPLETE REQUEST → RESPONSE FLOW                              │
│                                                                            │
│   Client                    Server                   LangGraph               Models        │
│  ┌───────┐              ┌─────────────┐           ┌──────────┐          ┌────────┐│
│  │ Chat │──────────▶│/orchestrate│─────────▶│SafetyNode│────────▶│ Gemini ││
│  │ Box │   POST     │   Route    │  invoke │ Pass     │         │   AI   ││
│  └───────┘  "Hi"    └─────┬──────┘          └────┬─────┘          └────────┘│
│       │                  │                      │                              │
│       │                  │                      ▼                              │
│       │                  │               ┌──────────────┐                    │
│       │                  │               │ IntentNode   │────▶ Intent: chat │
│       │                  │               └──────┬───────┘                    │
│       │                  │                      │                              │
│       │                  │                      ▼                              │
│       │                  │               ┌──────────────┐                    │
│       │                  │               │  Supervisor  │────▶ Route: buddy  │
│       │                  │               └──────┬───────┘                    │
│       │                  │                      │                              │
│       │                  │                      ▼                              │
│       │                  │               ┌──────────────┐                    │
│       │                  │               │ BuddyAgent   │────▶ Gemini AI    │
│       │                  │               └──────┬───────┘          │         │
│       │                  │                      │               ▼         │
│       │                  │               ┌──────────────┐     ┌────────┐│
│       │                  │               │ Persistence │     │"Hi! How││
│       │                  │               │   Node     │     │can I  ││
│       │                  │               └─────┬─────┘     │help?  ││
│       │                  │                     │          └────────┘│
│       │                  │                     │      ◀──────────────┘│
│       │                  │                     │                   │
│       ▼                  ▼                     ▼                   │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                      JSON Response                                   │  │
│  │  { messages: [{ role: "assistant", content: "Hi! How can I help?" }] }│  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                           │                                               │
│                           ▼                                               │
│  ┌───────┐                                                                 │
│  │ Render│  Chat bubble appears with AI response                      │
│  │  UI  │                                                                 │
│  └───────┘                                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔑 Key Concepts Explained

### What is LangGraph?
```
┌─────────────────────────────────────────────────────────────────────────┐
│                     LANGGRAPH EXPLAINED                                 │
│                                                                          │
│  Think of LangGraph as a STATE MACHINE for AI:                          │
│                                                                          │
│    ┌────────┐     ┌────────┐     ┌────────┐                            │
│    │ Node A │────▶│ Node B │────▶│ Node C │                            │
│    │(Safety)│     │(Intent)│     │(Buddy) │                            │
│    └────────┘     └────────┘     └────────┘                            │
│        │              │              │                                   │
│        │              │              │                                   │
│    Each node is a function that:                                       │
│    1. Takes STATE (messages, mood, etc.)                              │
│    2. Does some processing                                             │
│    3. Returns UPDATED STATE                                          │
│                                                                          │
│  The edges connect nodes. Conditional edges decide                      │
│  which node to go to next based on the state.                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### What is LangChain?
```
┌─────────────────────────────────────────────────────────────────────────┐
│                    LANGCHAIN EXPLAINED                                  │
│                                                                          │
│  LangChain = Library for building LLM-powered apps                       │
│                                                                          │
│  ┌──────────────────────────────────────────────────────┐              │
│  │  Components:                                        │              │
│  │  • ChatModels (Gemini, GPT, Claude, Llama)          │              │
│  │  • Prompts (Templates + Inputs)                    │              │
│  │  • Memory (Conversation history)               │              │
│  │  • Chains (Sequential processing)             │              │
│  │  • Tools (Functions the AI can call)            │              │
│  └──────────────────────────────────────────────┘              │
│                                                                          │
│  In our app:                                                            │
│  • ChatGoogleGenerativeAI - Connect to Gemini                          │
│  • withStructuredOutput - Get JSON responses                       │
│  • Message management - Handle chat history                    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Architecture Diagram - High Level

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                       HIGH-LEVEL ARCHITECTURE                                │
│                                                                            │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                     FRONTEND (Next.js)                              │   │
│   │  ┌─────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐    │   │
│   │  │  Chat   │   │  Voice  │  │  Image   │   │ Premium │    │   │
│   │  │   UI    │   │   UI    │  │   UI     │   │   Page  │    │   │
│   │  └────┬────┘   └────┬────┘  └────┬─────┘   └────┬─────┘    │   │
│   └───────┼─────────────┼─────────────┼─────────────┼──────────┘   │
│           │             │            │            │                  │
│           ▼             ▼            ▼            ▼                  │
│   ┌───────────────────────────────────────────────────────────┐    │
│   │                  API LAYER (/api/*)                       │    │
│   │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐ │    │
│   │  │orchestrate│ │ generate │ │  voice/  │ │   webhook    │ │    │
│   │  │  Chat AI  │ │Legacy API│ │  Stream  │ │  Media      │ │    │
│   │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────┬───────┘ │    │
│   └───────┼───────────┼───────────┼────────────┼──────────┼──────┘   │
│          │           │           │            │         │            │
│          ▼           │           │            │         │            │
│   ┌─────────────────────────────────────────────────────────┐     │
│   │           LANGGRAPH AGENT PIPELINE                       │     │
│   │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌───┐ │     │
│   │  │Safety│ │Intent│ │Sentim│ │Superv│ │Buddy │ │Img │ │     │
│   │  │Node │ │Node │ │Node │ │isor  │ │Agent │ │Gen │ │     │
│   │  └──┬──┘ └──┬──┘ └──┬──┘ └───┬──┘ └──┬──┘ └──┬──┘ │     │
│   └─────┼───────┼───────┼───────┼──────┼──────┼─────┼──────┘   │
│        │       │       │       │      │      │     │            │
│        ▼       ▼       ▼       ▼      ▼      ▼     ▼            │
│   ┌─────────────────────────────────────────────────────────┐     │
│   │                    AI PROVIDERS                        │     │
│   │   ┌────────────┐  ┌────────────┐  ┌────────────┐       │     │
│   │   │  Google    │  │ OpenRouter│  │  NVIDIA   │       │     │
│   │   │  Gemini    │  │ Llama/GPT │  │   NIM     │       │     │
│   │   └────────────┘  └────────────┘  └────────────┘       │     │
│   └─────────────────────────────────────────────────────────┘     │
│        │       │       │       │      │      │     │                │
│        ▼       ▼       ▼       ▼      ▼      ▼     ▼              │
│   ┌────────────────────────────────────────────────────────────────┐ │
│   │                     DATA LAYER                                 │ │
│   │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌──────────────┐        │ │
│   │  │ MongoDB │  │  Redis  │  │ Resend │  │  Razorpay   │        │ │
│   │  │ (Chats) │  │(Queue)  │  │ (Email)│  │ (Payments)  │        │ │
│   │  └─────────┘  └─────────┘  └─────────┘  └──────────────┘        │ │
│   └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📝 Summary

| Step | What Happens | Tools Used |
|------|--------------|-----------|
| 1 | Validate Auth | NextAuth JWT |
| 2 | Parse Request | Zod |
| 3 | Check Entitlements | MongoDB |
| 4 | Safety Check | Gemini + LangChain |
| 5 | Detect Intent | Gemini + LangChain |
| 6 | Analyze Sentiment | Gemini + LangChain |
| 7 | Inject Persona | LangChain Messages |
| 8 | Route to Agent | Gemini + Zod |
| 9 | Generate Response | Gemini + LangChain |
| 10 | Save Conversation | MongoDB |

---

*This document explains the complete journey of a chat message in Spherial AI!*