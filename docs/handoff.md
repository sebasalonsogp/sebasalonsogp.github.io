# Current handoff

## Current state

**Phase 1 is live** at https://sebasalonsogp.github.io/ (`noindex`) from `main` of the
public repository `sebasalonsogp/sebasalonsogp.github.io`; Sebastian approved the
checkpoint by moving on. **Phase 2 is live and approved** (checkpoint passed). **Phase 3 has started:** all four
slices are live and the Phase 3 checkpoint is approved. **Phase 4 has started:** slices 4.1
(visit), 4.2 (landing) and 4.3 (routes) are live (`main` b0735cd). Slice 4.4 (tour) is
done on `feat/tour`, not yet merged; next is 4.5 (journey tests), then the Phase 4
checkpoint. Every push to `main` runs the CI checks and deploys only if they pass.

## Slices 2.1 + 2.2 — sky and motion policy

- `src/features/motion/motion.ts`: reduced-motion state + `ambientLoop` (30 fps cap,
  pauses in hidden tabs, one still frame under reduced motion).
- `src/features/sky/stars.ts` (seeded, pure star field) and `sky.ts` (two-canvas
  renderer, CSS-transform parallax, `setYaw` for the explorer); `Sky.astro` in the layout.
  Footer gained "Star colors follow real stellar temperatures."
- Measured: twinkle changes ~4,900 star-layer pixels in 400 ms; cost ~1.3 ms (desktop) /
  1.6 ms (phone viewport) per frame in GPU Chromium on this machine, ~3.1 ms without GPU.
  10-second clips (1440×900, 390×844) were sent to Sebastian. Initial JS 2.4 KB gzip.
- `tests/e2e/sky.spec.ts`: painted and non-blocking, twinkle, scroll parallax, pause and
  resume on visibility, reduced motion still and parallax-free, seeded. 24 tests × 3
  browsers = 72 passing. `npm run verify` passes.

## Slice 1.1 — content model

Strict Zod collections (`projects`, `experience`, `education`) in `src/content.config.ts`;
validated data modules `src/data/site.ts`, `src/data/skill-groups.ts` (35 skills) and
`src/data/github.json` (hand-entered); access helpers in `src/lib/content.ts`. All concept
content migrated; each validation rule was shown to fail the build when broken.

## Slice 1.2 — tokens and fonts

- `src/styles/tokens.css`: color, type scale, spacing, layout, radii and UI motion tokens
  (reduced motion zeroes durations). New values recorded in `docs/design-spec.md`.
- Fonts: `@fontsource-variable/newsreader`, `@fontsource-variable/schibsted-grotesk`,
  `@fontsource/ibm-plex-mono` (5.3.0). `src/components/Fonts.astro` declares Latin-only
  faces (Fontsource has no Latin-only CSS for variable fonts), so the build emits just 5
  woff2 files; the two upright faces on first paint are preloaded.
- `src/styles/global.css` rebuilt on the tokens; the placeholder page uses them.
- Checked in the browser (built preview): fonts load from the site and apply to headings,
  body and eyebrow; 1440×900, 390×844 and 320 px have no horizontal scroll; skip link shows
  the `--sol` focus ring; no console errors. Reduced motion verified by reading the
  stylesheet rule (the browser tool cannot emulate it).
- `npm run verify` passes.

## Slice 1.3 — page skeleton

- `src/components/PortfolioPage.astro` composes the page from the collections and
  `site.ts`: `SiteNav`, `Hero` (height reserved for the explorer), `ProjectList` (+
  earlier work), `ExperienceList` (+ education), `SkillGroups`, `ContactSection`,
  `SiteFooter`. Shared `Section` frame and `ExternalLink` (announces new tabs).
- Helpers: `src/data/taxonomy.ts` (domain and lane labels), `src/lib/format.ts` (dates,
  durations, skill anchors, base paths), `src/lib/skills.ts` (skills derived from content).
- Copy email is the only script (inline, hidden without JavaScript). `noindex` added to
  the layout now rather than in 1.6.
- Checked in the built preview at 1440×900, 390×844 and 320 px (no horizontal scroll),
  keyboard order and focus rings, skill chips resolve to skill anchors, no console errors.
  Copy email exercised via its selection fallback (the pane blocks clipboard); the
  clipboard success path is untested. `npm run verify` passes.

## Slice 1.4 — project routes

- `src/pages/projects/[id].astro` renders `PortfolioPage` with `initialProject`; the hero
  shows `ProjectVisit` (readable visit panel) and carries `data-initial-project`.
  Per-project title and description. Project rows link to their pages.
- Media copied byte-for-byte from `references/concept/media` (Sebastian's choice):
  images and the poster to `src/assets/projects/<id>/` (served as responsive WebP), the
  video to `public/media/eigenflow/`. `src/lib/media.ts` resolves them in
  `getProjects()`; a missing image or video fails the build (both shown). Image entries
  now require `alt`, written from the screenshots.
- Added `@types/node` 24.19.2 (dev) for the build-time file check.
- Checked in the built preview at 1440×900, 390×844 and 320 px (no overflow): all 5 routes
  load directly, row → page, prev/next wrap, video/poster/images return 200, no console
  errors. `npm run verify` passes.

## Slice 1.5 — test harness

- `@playwright/test` 1.64.1 and `@axe-core/playwright` 4.14.0; `playwright.config.ts`
  builds and serves the production output on port 4322 and runs Chromium, Firefox and
  WebKit (4 workers locally, 2 in CI; unbounded workers caused random timeouts).
  `npm test` runs it; CI installs the browsers and runs it after the existing checks.
- `tests/e2e`: home (sections, nav scrolls, skip link, skill links, contact paths, new-tab
  links, copy email, 320 px, no-JS content), projects (row → page, direct loads, next wraps,
  media loads, 320 px), a11y (axe WCAG 2.2 AA on home and every project page). Projects are
  discovered from the page, not hard-coded. 16 tests × 3 browsers = 48, passing twice in a
  row (1.4 min).
- The suite found a real bug: at 320 px the contact column overflowed by 8 px (fixed in
  `ContactSection.astro`). The in-app browser had widened its 320 px viewport to 328 and
  hidden it, so the 320 px claims in slices 1.2–1.4 were wrong.

## Slice 1.6 — GitHub Pages

- `astro.config.mjs` sets `site`/`base`; `src/pages/404.astro` (plain; black hole in 7.3);
  `deploy.yml` (check via `ci.yml` → build → deploy, actions pinned by SHA); resume PDF
  in `public/` with a download test. 18 tests × 3 browsers = 54 passing.
- Before the first push the 9 local commits were re-authored from the old work identity
  to `sebasalonsogp <sebasagpf@gmail.com>` (Sebastian's choice), set in this repo's local
  git config; content unchanged. The global git config still holds the old identity.
- First deploy (run 39681323004) passed all jobs. Live checks: home and project pages 200
  (direct load and refresh), `/projects/eigenflow` → 301 to the slash URL, unknown path
  404 with the custom page, resume PDF and video served, `noindex` everywhere, no console
  errors.

## Slice 2.3 — visual pass

- Type rule applied (mono only for dates, numbers, handles, tiny labels); no text under
  12 px. `--halo` on small dim text keeps it ≥ 4.5:1 over star glows. Contrast measured
  on 1,473 text runs over the running sky: all pass (method in `docs/design-spec.md`).
- "How to read" popovers moved to the slices that build their graphics (3.4, 5.2, 6.2).
- Checked in the browser at 1440×900 and 390×844: hierarchy, keyboard focus ring on chips,
  no horizontal scroll, no console errors. `npm run verify` passes; `npm test` 72 passed.

## Slice 3.1 — explorer scene shell

- `three` 0.186.1 (+ `@types/three` 0.186.0). `src/features/explorer/`: `support.ts`
  (WebGL2 check), `camera.ts` (concept framing as a Three.js camera), `explorer.ts`
  (renderer, resize via ResizeObserver, IntersectionObserver pause, context loss, dispose).
  Hero script loads it after `load` at idle; canvas is `aria-hidden`, no pointer events
  yet (drag in 3.3). `ambientLoop` gained `fps`, `active` and `onState` options.
- Scene is empty until 3.2; framing will be checked visually when the star exists.
- Tests (`explorer.spec.ts`): loads after `load` and fills the hero, hero text is LCP
  (not in WebKit), pauses off screen and resumes, follows resizes, reduced motion is static,
  no WebGL2 → chunk never fetched and the readable page stays. 30 tests × 3 browsers: 89
  passed, 1 skipped. Initial JS ~4 KB gzip; explorer chunk 129 KB gzip.

## Slice 3.2 — bodies from data

- The hero embeds the projects (orbit order) as JSON (`src/lib/system-data.ts`); the
  explorer lays out star, orbits, planets, rings, moons and belt from it
  (`system.ts` pure layout, `bodies.ts`, `shaders.ts`). Values in `docs/design-spec.md`.
- Checked in the browser at 1440×900 and 390×844 against the concept: star at 64% / 56%
  (phone 50% / 68%), five orbits, rings on the four live demos, Wine Journal's three moons,
  belt. Surfaces inspected in a throwaway build with 6× planets (not committed): banded,
  ice, rocky and ocean worlds lit from the star. No console messages in a fresh tab.
- Performance (headed Chromium, RTX 2070): no dropped frames at the display's 165 Hz;
  explorer capped at 60 fps; main thread ~1.2 ms per rendered frame (~4.4 ms at 4× CPU
  throttle). Mid-range and phone GPUs still to confirm (Phase 8).
- Project pages no longer mount the explorer until Phase 4 frames visits.
- Tests: one planet per project in list order, star framing at desktop and phone (screenshot
  difference with and without the canvas, blurred in JS so WebKit works), project pages
  without the explorer. 34 tests × 3 browsers: 101 passed, 1 skipped.

## Slice 3.3 — labels and interaction

- `labels.ts`: HTML label layer (planet links, star and belt labels, highlight ring) placed
  each frame from projected positions. `explorer.ts`: drag/tilt, hover, click to open a
  project, idle drift, project-row and label-focus highlights, orbit highlight in
  `bodies.ts`; the explorer's yaw drives the sky (`setSkyYaw` in `sky.ts`). The embedded
  data is now `{ star, earlierWork, projects[] }` with each project's `href`.
- Checked in the browser at 1440×900 and 390×844 (labels match the concept; belt label shows
  on phones, hidden at 1440×900 by the concept's bottom-edge rule) and keyboard order
  (intro, then labels). The belt label first clipped on phones (measured while hidden); fixed.
- Tests: labels link to each project in list order, label hover/focus and row hover
  highlight, drag turns the system, clicking a planet opens its page. 39 tests × 3
  browsers: 116 passed, 1 skipped. Explorer chunk 139 KB gzip; initial JS ~4 KB.

## Slice 3.4 — hero key popover

- `HowToRead.astro` (reusable for 5.2 and 6.2): native `<details>` with Escape and
  outside-click closing. Hero hint "Drag to turn · Select a world" plus the system key, shown
  only once the explorer mounts.
- Browser check found two bugs, both fixed: the popover was unclickable (Astro scoped the
  hint's pointer-events rule away from the other component's `<details>`) and it overflowed
  on phones (the hint row now stacks). Fits at 390 and 320 px.
- Tests: hint and key appear only with the explorer, six terms, Escape returns focus, click
  outside closes. 41 tests × 3 browsers: 122 passed, 1 skipped.

## Slice 4.1 — visit state machine and panel

- `camera.ts`: visit pose, side-lit yaw, interruptible eased transitions with the hop arc.
  `panel.ts`: the visit panel (tabs, actions, stack, previous/next). `explorer.ts`: modes,
  orbital slow-down, dimming, focus return, triggers (planet, label, project row, Esc,
  back, prev/next). `explorer.css` now holds all styles for script-created elements
  (moved out of `Hero.astro`). Embedded data gained title, summary, brief, log, tech,
  demo and repo URLs.
- Browser checks (Playwright, real flights) at 1440×900 and 390×844: visit, tabs, hop,
  Esc, list visit with scroll. Found and fixed: focus did not return after Esc (labels were
  hidden during the return); the panel class clashed with the static page's `.visit`
  (renamed `explorer-visit`). Phone layout matches the concept (planet above the sheet).
- Tests: `visit.spec.ts` (label, planet and row visits, tabs, prev/next wrap, Esc and back
  focus, inert panel, axe on the open panel, mode sequence with motion); the slice 1.4 row
  test now runs without WebGL2 (where rows still open the static page). 48 tests × 3
  browsers: 143 passed, 1 skipped. Explorer chunk 141 KB gzip.

## Slice 4.2 — landing previews

- `landing.ts` (screen, dots, phone preview, lightbox `<dialog>`), landing pose in
  `camera.ts`, optimized media in the embedded data (`toSystemData` is now async and uses
  `getImage`), styles in `explorer.css`.
- Checked with real flights (Playwright) at 1440×900 and 390×844 and in a GPU window: layout
  matches the concept; dots, lightbox focus/arrows/Escape order, no-media project, phone
  preview all work; no console errors.
- Unexplained, not reproduced: twice, headless screenshots taken during or right after a
  flight showed the canvas blank above the landing screen's shadow. Afterwards 8/8 headless
  runs and a GPU window rendered correctly. Re-check on real devices in Phase 8.3.
- Tests (in `visit.spec.ts`, projects chosen from the data): landing with dots, lightbox
  (focus, arrows, image loads, Escape order), no landing without media, poster under reduced
  motion, phone preview. 53 tests × 3 browsers: 158 passed, 1 skipped. Explorer chunk
  143 KB gzip; home HTML 11 KB gzip.

## Slice 4.3 — routes and history

- `explorer.ts`: pushState on visits, replaceState on hops, popstate drives the scene,
  leaving a visit opened from home uses `history.back()`, titles and `aria-current`
  follow; direct loads hand the static visit to the explorer and open it instantly without
  moving focus. `Hero.astro` renders intro and hint on both routes (pitch is a `p` on
  project pages); the explorer starts at `load` or after 2.5 s. Title formats shared via
  `homeTitle` / `projectTitle` in `site.ts`.
- Checked with Playwright: URL, title and current row on visit; Back/Forward; Esc steps back
  (history length +1 only for the visit); hops replace; direct load (static first, then the
  explorer visit, focus untouched); Esc from a direct load pushes `/` and shows the intro.
- Tests: routes and history in `visit.spec.ts`; static-page tests now run without WebGL2
  (shared `withoutWebGL2` helper); axe waits for a settled page (`settled` helper; a scan
  during the panel fade measured half-transparent text). 57 tests × 3 browsers: 167 passed,
  1 skipped.

## Slice 4.4 — tour

- Hero button "Take the 60-second tour" (shown with the explorer); embedded data gained
  `tour` (ids by `tour` position). `explorer.ts` runs the stops; `panel.ts` adds the tour
  bar; `landing.ts` and the panel tabs report interactions so they stop the tour. Timing
  and stop rules in `docs/design-spec.md`.
- Checked: full tour at 1440×900 (URL replaced per stop, end returns to `/` with focus on
  the button); at 375×812 by keyboard (Enter starts, focus on "Stop tour", Esc mid-tour
  returns to `/` with focus on the button and nothing restarts, no horizontal scroll);
  reduced motion at 390×844 (track hidden, next stop after ~6.9 s).
- Tests: tour in `visit.spec.ts` (order and label, history replaced, interaction stops it,
  "Stop tour" focuses the title); the no-WebGL2 test checks the button stays hidden.
  59 tests × 3 browsers: 173 passed, 1 skipped.

## Next task

Phase 4, slice 4.5 — journey tests (plan: visit, land, return, then visit; Back/Forward,
direct load, tour stop, reduced motion), then the Phase 4 checkpoint (merge `feat/tour`
and deploy on Sebastian's go-ahead).

## Open inputs and issues

- **WebKit + WebM:** Playwright's Windows WebKit never fires `load` on a page with a real
  WebM video (any markup; Chromium is fine), so tests wait for `domcontentloaded`. Confirm
  the Eigenflow page on real Safari/iOS in Phase 8.3; an MP4 (H.264) source in Phase 4.2
  would be the safe fallback. WebKit also keeps links out of the Tab order (Safari
  default), so the skip-link test focuses the link directly there.
- **axe "incomplete" (needs a human):** `color-contrast` on some elements (measure in 2.3)
  and `video-caption` for the Eigenflow demo; no captions are needed if the recording is
  silent. Confirm.
- **Sky cost on real hardware:** confirm < 2 ms/frame on a mid-range laptop and a phone
  in Phase 8.2; this machine is likely faster than mid-range.
- `npm test` fails to start if another `astro preview` is running (Astro allows one).
- **Font weight:** Newsreader with the opsz axis (as specified) is 129 KB per face vs 57 KB
  weight-only. Revisit in Phase 8 if LCP needs it. No fallback metric overrides yet (CLS
  check in Phase 8).
- **Streamlit demos sleep:** the Quantum Playground demo showed Streamlit's "gone to
  sleep" screen when opened. Idle Community Cloud apps sleep, so visitors may have to wake
  them. Consider a keep-alive or a note near the demo buttons.
- Phone is shown (Sebastian's decision); it is also in the public repo and resume.
- Eigenflow's page stacks three media items before the text on phones; Phase 4.2's
  carousel (dots + lightbox) should replace the stack.
- SVD Lens and Exoplanet share `lastCommit` 2026-09-15; ties sort by id, so Exoplanet
  orbits inside SVD Lens (the concept had the reverse). Real commit times from the sync
  script (Phase 8) would settle it.
- Final pitch (draft in use); PadStats title on LinkedIn ("Software Engineer") vs resume
  ("Founding Software Engineer"); screenshots for SVD Lens and the real Wine Journal app. The resume
  lists the PadStats role as "Founding Software Engineer – Cloud & ML Systems".

## Media sources

In the repo now (copied from the concept's crops). Originals for later replacement live in
the project repositories: Eigenflow `docs/media/*`, Exoplanet
`docs/assets/dashboard-preview.png`, Quantum `assets/quantum-playground-demo.png`, Wine
Journal `design/prototype-v3/checks/desktop-my-wines.png` (prototype). Still missing: SVD
Lens (none) and real Wine Journal screenshots.

## Session start checklist

Read `AGENTS.md`, this file, `PRODUCT.md`, `docs/design-spec.md` and the current item in
`tasks/todo.md`; inspect `git status` and recent commits before editing.
