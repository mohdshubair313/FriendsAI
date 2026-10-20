# Project progress

## 2026-10-19 — Rare UI AI Kit and Gemini search

- Installed and integrated all five Rare UI AI Kit components in active chat and
  voice interfaces, preserving LiveTalk avatar mode and homepage WebGL.
- Added native Gemini streaming and Google Search grounding, an actual Search
  toggle, source cards/citation chips and persisted search metadata. Existing
  Gemini key is used server-side; no credentials were exposed or changed.
- Added animation visibility pausing, on-demand UI loading, token batching,
  message memoization, voice cleanup and responsive navigation/composer fixes.
- Production build, TypeScript, targeted lint, seven provider tests and mocked
  browser integration checks pass. See `docs/ai-kit-integration.md`.
- Fixed completion transitions so finished status labels and search skeletons
  are removed immediately; production browser checks now verify both states.
- A real Gemini search request returned HTTP 429. Successful live search is
  unverified pending provider quota/rate-limit resolution; the UI reports this
  clearly and Search off retains the existing chat fallback chain.
- Rare UI attribution and upstream license retained in README/docs.

## 2026-10-19 — Preserve original v2 visuals while optimizing

- User clarified that all original 3D/WebGL and animation effects must remain.
  Restored the original v2 composition at `/`; `/v2` permanently redirects home.
- Retained app-provider isolation and static homepage delivery from the first pass.
- Optimized automatic WebGL loading, offscreen/tab rendering, animation feature
  imports, waveform transforms and magnetic-button layout reads.
- Kept original 5,200 + 1,200 particles, DPR and antialiasing.
- Browser checks exercise actual WebGL draw calls, original effects, SPA
  navigation, responsive layouts, reduced motion and no-JavaScript content.
- Current validation and measurements are in `docs/landing-performance.md`
  and ignored `artifacts/landing/optimized.json`. The earlier 69% claim applied
  to the rejected simplified design and is not a result for this version.
- Final production build, TypeScript, targeted lint and browser checks pass.
  Full-effects JavaScript transfer measured 404,401 bytes versus the original
  459,384 bytes (11.8% less). Offscreen and simulated hidden-tab samples each
  recorded zero WebGL draws; the original particle counts render when visible.
- Existing user changes to `all_imports_py.txt`, `all_imports_ts.txt`, and
  `FriendsAIinfo.md` were preserved.
