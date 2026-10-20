# Rare UI AI Kit integration

The five components were installed from the official Rare UI shadcn registry.
The active `/chat` and `/live_talk` interfaces use them, rather than an unused
demo page. See the [upstream kit](https://www.rareui.com/components/fluidorb)
and [license](licenses/rare-ui.txt).

| Component | Integration |
| --- | --- |
| Fluid Orb | Chat voice modal and LiveTalk sphere stage; existing avatar mode remains available |
| Matrix Orb | Composer readiness/thinking, voice listening/speaking, LiveTalk audio amplitude |
| Inline AI Status | Actual streaming, image generation/upload, completion, stopped and error states |
| Grid Reveal | Pending image generation to completed image, persisted images, load error/retry |
| Web Search | Gemini source cards, expandable results and inline citation chips |

## Gemini and native search

`src/lib/chat/gemini.ts` calls Gemini's streaming REST API on the server, using
the existing `GOOGLE_GENERATIVE_AI_API_KEY` (or `GEMINI_API_KEY`).
`GEMINI_CHAT_MODEL` defaults to `gemini-3.5-flash-lite` and can be overridden.
No provider SDK or API key is added to the browser bundle.

Search is enabled by default in chat, with a working on/off toggle. The request
includes `google_search` only when enabled. Gemini decides whether a query needs
search. Source cards and citations use provider grounding metadata; an ungrounded
answer does not claim that sites were searched. Plain markdown links are labelled
as linked sources when there is no grounding metadata.

Grounding metadata is saved with the assistant message and restored through the
existing authenticated conversation-history API. Google's returned Search
Suggestions are displayed in a sandboxed iframe with scripts disabled. The
existing persona/mood system prompt is retained. Follow-up requests include the
recent conversation instead of sending only the latest user message.

Search failures are visible. HTTP 429 produces a quota/rate-limit message. With
Search off, a Gemini failure before the first token can use the existing chat
provider fallback chain. Search-enabled requests never fall back silently to an
ungrounded answer. Provider search usage can incur charges.

References: [Google Search grounding](https://ai.google.dev/gemini-api/docs/generate-content/google-search),
[streaming API](https://ai.google.dev/api/generate-content),
[model](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite).

## Frontend changes

- Voice modal, Fluid Orb, Grid Reveal and Web Search load on demand.
- Fluid/Matrix animation loops stop offscreen and in hidden tabs; reduced motion
  renders still frames. Grid Reveal also pauses in hidden tabs and stops after
  revealing the image.
- Token updates are coalesced per animation frame. Memoized previous message
  bubbles avoid repeated markdown work; scrolling follows the stream only when
  the user is near the bottom.
- Voice recognition is initialized once and stopped on close. Speech is not
  requeued for every token. Modal keyboard focus/Escape are supported.
- Mobile navigation uses a drawer; mood chips scroll horizontally; the composer
  keeps a full-width typing area on narrow screens.
- Homepage WebGL and original visual effects from the preceding work remain.

## Validation and limits

Production build, TypeScript and targeted ESLint pass. Seven provider tests cover
split UTF-8/SSE frames, Unicode citations, unsafe URLs, thought filtering, search
off/no sources, quota errors, truncated streams and pre-request cancellation.

`scripts/check-ai-kit.cjs` exercises the real browser components and SSE reader
with mocked provider/session/history APIs: states, search toggle, follow-up
context, sources/citations, reload, stop/error, image reveal, microphone cleanup,
hidden-tab rendering, reduced motion, responsive widths and mobile navigation.
It does not test live microphone hardware or write production conversations.

One live Gemini search request was attempted using the configured key. It returned
HTTP 429. Successful live grounding therefore remains unverified until the
project's quota/rate limit is resolved. No account billing or quota settings were
changed. Browser checks use clearly isolated fixtures and make no provider calls.

```powershell
npx vitest run src/lib/chat/gemini.test.ts
npm run build
npm run start -- -p 3102
node --env-file=.env scripts/check-ai-kit.cjs
# Makes one real provider request:
npx tsx --env-file=.env scripts/check-gemini.ts
```

Browser screenshots are written under ignored `artifacts/ai-kit/`.
