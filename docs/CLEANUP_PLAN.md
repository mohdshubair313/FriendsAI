# Cleanup Plan

> Full codebase audit results — everything that is dead, unused, or duplicated.

## Phase 1: 100% Safe — No Impact on Anything

| Action | Path | Reason |
|--------|------|--------|
| Delete folder | `src/action/` | Empty directory |
| Delete file | `src/app/chat/ChatLoader.tsx` | Never imported |
| Delete file | `src/components/CameraPreview.tsx` | Never imported |
| Delete file | `src/components/chatComponents/AudioVisualizer.tsx` | Never imported |
| Delete file | `src/components/chatComponents/LatencyIndicator.tsx` | Never imported |
| Delete file | `src/components/magicui/sparkles-text.tsx` | Never imported |
| Delete file | `src/components/ui/text-reveal-card.tsx` | Never imported |
| Delete file | `src/components/ui/floating-dock.tsx` | Never imported |
| Delete file | `src/components/ui/typewriter-effect.tsx` | Never imported |
| Delete file | `src/services/avatar/avatarAnimationService.ts` | Never imported |
| Delete file | `lib/utils.ts` (root) | Duplicate of `src/lib/utils.ts` |
| Delete file | `src/app/utils/audioUtils.ts` | Duplicate of `src/utils/audioUtils.ts` |
| Delete file | `src/models/EmotionEvent.ts` | Dead model — never imported by any consumer |
| Delete file | `src/models/ModerationEvent.ts` | Dead model — never imported |
| Delete file | `src/models/ProviderUsageLog.ts` | Dead model — never imported |
| Delete file | `src/models/VoiceSession.ts` | Dead mongoose model — never imported |
| Delete file | `src/models/ChatModel.ts` | Dead legacy model — already marked "will be removed" |
| Delete file | `src/models/index.ts` | Barrel file — nobody imports from `@/models` |
| Delete file | `src/services/geminiWebSockets.ts` | Only consumer = CameraPreview (dead) |
| Delete file | `src/services/transcriptionService.ts` | Only consumer = geminiWebSockets (dead) |
| Delete file | `src/utils/audioUtils.ts` | Only consumer = geminiWebSockets (dead) |

## Phase 2: Dead API Routes

| Action | Path | Reason |
|--------|------|--------|
| Delete route | `src/app/api/debug/route.ts` | Dev-only, no consumer |
| Delete route | `src/app/api/test-orchestrate/route.ts` | Test stub only |
| Delete route | `src/app/api/webhooks/media/route.ts` | BullMQ webhook — no worker exists |
| Delete route | `src/app/api/voice/session/route.ts` | Only consumer was dead CameraPreview |
| Delete route | `src/app/api/avatar/session/route.ts` | No frontend consumer |
| Delete route | `src/app/api/avatar/signal/route.ts` | No frontend consumer |
| Delete route | `src/app/api/generate/route.ts` | Replaced by `/api/orchestrate` |
| Delete route | `src/app/api/user/onboarding/route.ts` | No frontend consumer |

## Phase 3: npm Dependencies to Remove

| Package | Reason |
|---------|--------|
| `@ai-sdk/react` | No imports |
| `@fortawesome/fontawesome-svg-core` | No imports (might be peer dep — test first) |
| `@fortawesome/free-solid-svg-icons` | No imports |
| `@google/generative-ai` | No imports |
| `@langchain/community` | No imports |
| `@langchain/google-genai` | No imports |
| `@langchain/langgraph` | Only in a mock code string — not actually used |
| `@tailwindcss/postcss` | No references |
| `mongodb` | `mongoose` handles everything |
| `remark-parse` | No imports |
| `remark-rehype` | No imports |
| `uuid` | No imports |
| `@svgr/webpack` (dev) | No config reference |
| `baseline-browser-mapping` (dev) | No references |

## Phase 4: Questionable (verify before removing)

| Item | Concern |
|------|---------|
| `src/app/v2/chat/` (ClientChatV2 + page) | Mock/placeholder — if `/v2/chat` isn't linked, it's dead UI |
| `src/models/AvatarSession.ts` | Only used by dead avatar routes |
| `src/services/avatar/webrtcService.ts` | Only used by dead avatar routes |
| `@fortawesome/fontawesome-svg-core` | May be runtime peer dep |
| `tsx` | Only used for `npm run seed:demo` |
| `sharp` | Next.js internal — keep |
