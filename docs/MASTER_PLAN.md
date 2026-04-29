# Friends AI - Agentic Upgrade Master Plan

**Document type:** Production HLD + LLD + Implementation Roadmap
**Owner:** Engineering
**Status:** Draft v2.0
**Target stack:** Next.js 16 (App Router) · React 19 · TypeScript · Vercel AI SDK v6 · LangChain.js · LangGraph · MongoDB (Mongoose) · NextAuth · BullMQ + Valkey/Redis · Razorpay · NVIDIA API Catalog · OpenRouter

---

## 0. Executive Summary

Friends AI should evolve from a mood-based single-model chatbot into a durable agentic companion platform with three premium pillars:

1. Smarter multi-agent conversation orchestration.
2. Premium multimodal generation across text, voice, image, classification, and detection.
3. A premium live avatar experience that feels closer to Zoom or Google Meet than a simple voice mode.

The current repository is not there yet. Before major implementation begins, the system needs stabilization in build health, entitlement modeling, persistence, provider abstraction, and server-side multimodal control. This plan reflects that reality and sets the order of work accordingly.

---

## 1. Current State Summary

### What exists today

- Next.js app with auth, mood-based chat, and Razorpay payment endpoints.
- A single text chat route based on Gemini.
- A boolean premium flag on the user model.
- Experimental live-talk and browser voice features.
- Basic MongoDB persistence and Redux state.

### What is missing

- LangChain/LangGraph agent graph orchestration.
- Durable conversation/session state for agent workflows.
- Subscription-grade entitlement, quotas, and webhooks.
- Queue-backed async media jobs.
- A provider router for NVIDIA and OpenRouter models.
- A production-safe premium live avatar stack.

---

## 2. Core Product Principles

1. Stabilize first, then scale features.
2. All premium capabilities must be entitlement-driven, not prompt-driven.
3. All multimodal provider access must be server-side.
4. LangGraph should be the orchestration backbone for complex agent behavior.
5. Model selection should be task-based and provider-agnostic.
6. The premium live avatar must feel human, responsive, and consistent across voice, gesture, and UI.

---

## 3. Target Architecture

### 3.1 High-level flow

`Client UI -> Middleware/Auth/Entitlement -> LangGraph Supervisor -> Specialist Agents -> Tools/Queues/Providers -> Streamed UI Output`

### 3.2 Why LangChain + LangGraph

LangChain gives the codebase reusable model, tool, prompt, parser, retriever, and memory primitives. LangGraph should be the main orchestration runtime because this product needs:

- graph-based branching
- retries and fallback paths
- checkpoints
- resumable execution
- tool state
- better support for agent supervision
- future human-in-the-loop control

### 3.3 Planned graph structure

- `SupervisorGraph`
- `SentimentNode`
- `IntentNode`
- `EntitlementGateNode`
- `PersonaNode`
- `RecommendationNode`
- `ImageGenerationNode`
- `VoiceNode`
- `AvatarSessionNode`
- `SafetyNode`
- `PersistenceNode`

---

## 4. Provider and Model Orchestration

### 4.1 Required providers

- `OpenRouter`
- `NVIDIA API Catalog`
- optional direct vendor integrations where needed for latency or pricing

### 4.2 Provider router requirement

Create a dedicated provider router layer under `src/services/models/` so the app does not call individual providers ad hoc from routes or UI experiments.

### 4.3 Model selection policy

Use the best-fit model for the task rather than one model for everything:

- text routing and lightweight classification: small fast models
- deep companion chat and reasoning: stronger conversational models
- image generation: top-tier image model via OpenRouter or NVIDIA-supported provider
- classification and detection: specialized multimodal or vision-capable models
- voice output: low-latency streaming TTS models
- avatar behavior and gesture timing: low-latency multimodal inference plus deterministic animation logic

### 4.4 Mandatory plan addition from product direction

The system must support `NVIDIA API keys` and `OpenRouter API keys`, and it must orchestrate best-in-class models across:

- voice agents
- image generation
- classification
- detection
- multimodal reasoning

This orchestration should be policy-driven with fallback rules, cost controls, latency targets, and safety checks.

---

## 5. Data Model Changes

### Replace flat storage with durable product entities

- `User`
- `UserPreferences`
- `Subscription`
- `Conversation`
- `Message`
- `EmotionEvent`
- `MediaJob`
- `VoiceSession`
- `AvatarSession`
- `ProviderUsageLog`
- `ModerationEvent`

### Required user additions

- locale
- timezone
- primary language
- consent settings
- voice preference
- avatar preference
- onboarding state

### Subscription changes

Replace `isPremium` with a proper `Subscription` document:

- tier: `free | pro`
- status
- quota
- provider references
- current period
- feature flags

---

## 6. API and Runtime Direction

### New primary routes

- `/api/orchestrate`
- `/api/media/enqueue`
- `/api/media/status/[jobId]`
- `/api/voice/stream`
- `/api/avatar/session`
- `/api/avatar/signal`
- `/api/webhooks/razorpay`
- `/api/webhooks/media`

### Runtime split

- fast orchestration routes: Node runtime
- queue workers: dedicated worker runtime
- live avatar sessions: dedicated real-time service path

Do not keep critical live multimodal logic in browser-only experimental services.

---

## 7. Premium Live Avatar Feature

### Product definition

Pro users should be able to talk with a live avatar in a real-time session that feels like speaking to a person in Zoom or Google Meet. The avatar should speak naturally, respond quickly, and show synchronized expression or gesture behavior.

### Required capabilities

- real-time voice conversation
- low-latency turn taking
- lip-sync or mouth movement sync
- gesture or expression animation
- avatar state persistence
- interruption support
- session start/stop controls
- moderation and abuse handling

### Architecture direction

- use a server-managed real-time session layer
- prefer WebRTC or equivalent real-time transport for live avatar sessions
- keep camera, microphone, entitlement, and provider orchestration under backend control
- use a dedicated `AvatarSession` state machine in LangGraph or a neighboring session coordinator

### Subscription placement

Live avatar access belongs to the `pro` or `premium` tier only.

### Quality bar

The live avatar should not ship as a cosmetic overlay. It should feel intentional, stable, and premium, with clear handling for:

- reconnect
- interruptions
- provider fallback
- safety moderation
- quota limits
- device compatibility

---

## 8. Security and Safety Requirements

1. No public AI provider keys in browser code for premium features.
2. All premium actions must pass entitlement gates.
3. All media generation must pass moderation.
4. All webhook updates must be verified with signatures.
5. Provider usage should be logged for audit, cost, and incident response.
6. Live avatar sessions need explicit user consent for mic/camera usage.

---

## 9. Observability Requirements

Add observability before large rollout:

- graph node traces
- provider latency
- token and cost reporting
- queue depth
- media job status
- subscription conversion telemetry
- avatar session quality metrics
- failure analytics

LangSmith and OpenTelemetry should be considered first-class tooling here.

---

## 10. Implementation Roadmap

### Phase 0 - Stabilization

- fix build and lint health
- clean broken docs and encoding issues
- remove client-exposed premium provider usage
- align package/runtime/tooling versions

### Phase 1 - Data and entitlement foundation

- add `Subscription`, `Conversation`, `Message`, `MediaJob`, `AvatarSession`
- migrate from `isPremium`
- add quotas and feature flags
- add Razorpay webhook lifecycle

### Phase 2 - LangChain and LangGraph foundation

- create `src/agents/`
- create graph state types
- add supervisor graph
- add sentiment, intent, and entitlement nodes

### Phase 3 - Provider router

- add OpenRouter adapter
- add NVIDIA adapter
- add model policy configuration
- add fallback and retry logic

### Phase 4 - Async multimodal services

- add BullMQ and Valkey
- image generation jobs
- moderation jobs
- media status updates

### Phase 5 - Premium voice

- streaming TTS
- voice preference storage
- voice session persistence
- interruption and quota handling

### Phase 6 - Premium live avatar

- avatar session service
- real-time transport
- gesture and lip-sync pipeline
- live entitlement checks
- UX polish and session analytics

### Phase 7 - Hardening

- load tests
- routing tests
- billing reconciliation tests
- moderation review
- privacy review

---

## 11. Target Folder Direction

```text
src/
  agents/
    graph/
    nodes/
    tools/
    prompts/
  services/
    models/
      openrouter/
      nvidia/
      router.ts
    voice/
    avatar/
    moderation/
    storage/
  queues/
  workers/
  models/
  lib/
  app/
    api/
      orchestrate/
      voice/
      media/
      avatar/
      webhooks/
docs/
  MASTER_PLAN.md
  CODEBASE_AUDIT_AND_GAP_ANALYSIS.md
```

---

## 12. Definition of Done for the Upgrade

The agentic upgrade is only considered ready when all of the following are true:

1. The app builds, lints, and runs cleanly in production.
2. Premium access is driven by real subscriptions and quotas.
3. LangGraph orchestrates the complex conversation and tool workflows.
4. NVIDIA and OpenRouter integrations are abstracted through a provider router.
5. Image, voice, classification, and detection workloads are routed to best-fit models.
6. The premium live avatar feature works reliably with real-time voice and gesture behavior.
7. Documentation matches the actual implementation state.

---

This document is the source of truth for the next implementation cycle. Every major architecture PR should update this plan in the same commit.
