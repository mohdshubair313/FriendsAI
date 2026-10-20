# V2 homepage: preserve the visual experience, optimize its execution

Updated 2026-10-19.

The original v2 design is the homepage at `/`; `/v2` redirects permanently.
The simplified redesign from the earlier pass has been replaced with the original
particle torus, aurora, grid and grain, magnetic buttons and shine, scrolling
technology marquee, feature illustrations, animated waveform, floating cards,
entrance reveals, testimonial parallax, pricing card treatment, and footer.

## Changes and their purpose

| Area | Change | Effect |
| --- | --- | --- |
| Homepage delivery | Static page composed mostly of Server Components | No request-time session lookup or artificial loading screen; static section content does not require its own client component code |
| Application dependencies | NextAuth, Redux, sidebar, command bar, app-only fonts and toast provider remain in the `(app)` route group | The landing makes no session request and does not load the application shell; existing app URLs remain unchanged |
| Hero entrance | Original blur, fade, translation and delays implemented in CSS | Starts from HTML/CSS, without waiting for React hydration |
| WebGL loading | Separate dynamic import, gated on visibility and first contentful paint, followed by an idle opportunity with a 750ms timeout | The full scene loads automatically after content paints; the timeout prevents idle scheduling from waiting indefinitely |
| WebGL execution | `frameloop="never"` offscreen or when the document is hidden; resume when visible | No continuous hidden GPU draws; existing canvas and buffers remain available |
| 3D quality | Original 5,200 torus + 1,200 accent particles, antialiasing, additive material and DPR range 1–2 retained | No particle-density or resolution downgrade |
| Scene internals | Removed unused size buffer and ineffective ambient light; narrowed subscriptions; clamped resume delta | Less unused allocation/upload work and no large rotation jump after pause |
| Motion features | Shared `LazyMotion` + `m` components | Retains entrance, spring and scroll effects while excluding unused drag/layout animation features from the landing bundle |
| Waveform | Animate `scaleY` rather than element height | Same visible bar-height sequence without per-frame document layout changes |
| Magnetic buttons | Cache bounds for a hover interaction instead of reading layout on each mousemove | Preserves spring movement while reducing repeated layout reads |
| CSS effects | One section observer pauses animations offscreen; visibility changes pause page animations | Aurora, floating tiles, pings and marquee do not keep animating where they cannot be seen |
| Marquee | Full-width loop translation | Duplicated tracks meet at the loop boundary without the previous half-track jump |
| Navigation | Next Link for internal app destinations; landing links do not eagerly prefetch app pages | Client-side navigation with less speculative loading |
| Resilience | Scene error boundary, reduced-motion support, no-JavaScript reveal fallback | Content remains usable if animation or WebGL is unavailable |

The full animated experience is the default. Reduced-motion preferences intentionally
show a still 3D scene and suppress motion; this is an accessibility preference,
not an automatic quality downgrade on phones.

The original desktop header is retained, with an accessible mobile menu. Footer
placeholder destinations now lead to existing pages or sections. The prior
checkout correction is retained: INR 99 for 30 days. The unsupported annual
discount is not offered. Backend billing logic was not changed.

## Measurement method

`scripts/check-landing.cjs` runs against a local production server in a fresh
headless Microsoft Edge context at 1440 × 1000. JavaScript response bytes are
summed from Resource Timing `encodedBodySize` after **the full 3D scene has
rendered**, including deferred WebGL modules.

The original v2 baseline in `artifacts/landing/before.json` recorded 459,384
JavaScript bytes across 19 requests, one session request, and one WebGL canvas.
The final result is saved separately to `artifacts/landing/optimized.json`.
Initial and deferred JavaScript are reported separately; deferred bytes are
not counted as eliminated.

Final local production result:

| Measurement | Original v2 | Optimized v2 with full effects |
| --- | ---: | ---: |
| Total JavaScript response bytes | 459,384 | 405,234 |
| Initial JavaScript response bytes | Not captured | 182,994 |
| Deferred JavaScript response bytes | Not separately captured | 222,240 |
| JavaScript requests | 19 | 16 |
| Landing session requests | 1 | 0 |
| WebGL canvases | 1 | 1 |
| Torus / accent point counts | 5,200 / 1,200 in source | 5,200 / 1,200 verified in GPU draw calls |

Total JavaScript transfer fell **11.8% with the effects retained**. In this run,
first contentful paint occurred at 1,196ms and the first deferred Next.js asset
request began at 1,479ms. The browser check observed zero WebGL draw calls during
each 350ms offscreen and simulated hidden-tab sample, with rendering resuming
when visible. All scripted assertions passed with zero uncaught browser errors.

The final production build (including TypeScript) and targeted ESLint pass.
Desktop and mobile full-page screenshots were visually inspected after scrolling
through every original section. Existing non-blocking build warnings concern
outdated browser-support data and the middleware-to-proxy convention.

The earlier 69% reduction belonged to the simplified version with effects
removed. It does **not** describe this restored animated implementation.

Download measurements do not establish an equivalent percentage improvement
in page-load time. First-paint measurements are local observations, not field
Core Web Vitals; the original baseline did not record timing for comparison.

## Verification

The browser check instruments actual WebGL `drawArrays` calls. It verifies:

- Both original point counts render and continue animating while visible.
- Offscreen rendering stops and resumes without removing the canvas.
- The visibility-change handler stops rendering and CSS animation. The test
  simulates the document's hidden state; it is not a device battery benchmark.
- WebGL module requests begin after first contentful paint.
- The waveform remains animated while its CSS layout height stays constant.
- Magnetic interaction, same-document sign-in navigation and browser back work.
- Mobile menu navigation and Escape dismissal work.
- Layout has no horizontal overflow at 320, 390, 768, 1024 and 1440px.
- Original sections are visited through progressive scrolling for screenshot QA.
- `/v2` redirects home; unauthenticated `/chat` redirects to sign-in.
- Content remains readable without JavaScript.
- Reduced-motion preference keeps the canvas still and stops CSS animations.
- No uncaught browser exceptions or broken fragment links occur.

Production build, TypeScript and targeted ESLint are also checked. Authenticated
chat, voice and payment flows have not been exercised with a real account.

## Reproduce

Build and serve:

```powershell
npm run build
npm run start -- --port 3102
```

In another terminal, with Playwright and Microsoft Edge installed:

```powershell
$env:LANDING_URL = 'http://localhost:3102'
node scripts/check-landing.cjs
```

Screenshots and measurements are written to the ignored `artifacts/landing/`
directory. Set `PLAYWRIGHT_CHANNEL` to another installed browser channel if needed.

References: [React Three Fiber rendering](https://r3f.docs.pmnd.rs/api/canvas),
[Motion LazyMotion](https://motion.dev/docs/react-lazy-motion),
[Next.js linking and navigating](https://nextjs.org/docs/app/getting-started/linking-and-navigating).
