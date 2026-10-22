# Current handoff

## Current state

**Phase 1 is live** at https://sebasalonsogp.github.io/ (`noindex`) from `main` of the
public repository `sebasalonsogp/sebasalonsogp.github.io`; Sebastian approved the
checkpoint by moving on. **Phase 2 is live and approved** (checkpoint passed). **Phase 3 has started:** all four
slices are live and the Phase 3 checkpoint is approved. **Phase 4 is live** (`main` c0151cb,
deploy run 39732028756) and Sebastian approved its checkpoint by moving on. **Phase 5 is
live** (`main` a41cd97, deploy run 39778943782) and its checkpoint is approved. **Phase 6
has started:** Phase 6 is live (`main` 61f943a, deploy run 39783890725) and its checkpoint is
approved. **Phase 7 is live** (`main` 66ac6ae) and its checkpoint is approved. CI now runs in the
Playwright container (`main` 93ffdce). **Phase 8 has started:** 8.1 (accessibility audit)
and 8.2 are live; 8.3's automated part is live (`main` 165747f); real devices and the
screen-reader pass are outstanding. 8.4 (SEO and sharing) is on `feat/seo`, not merged. Every push to `main` runs the CI checks and deploys only if they pass.

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
  clipboard success path is untested (covered since 7.1). `npm run verify` passes.

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

## Slice 4.5 — journey tests

- `tests/e2e/journey.spec.ts`: list → fly → land → lightbox → return → another world with
  real flights, then Back/Forward (history grows by one entry); Esc mid-flight; Back with
  the lightbox open; Back during the tour; every project URL in the explorer plus a
  reload of a visit opened from home; a phone journey through the panel preview. Shared
  explorer helpers (`ready`, `projectList`, `mediaCounts`, …) moved to `helpers.ts`.
- Found and fixed: Back (or a phone's back gesture) with the lightbox open returned the
  scene but left the modal open over the system; Forward to another project kept stale
  items in it. `landing.ts` now closes the lightbox on every visit change without
  sending focus back to the departing screen. The new test fails without the fix.
- 65 tests × 3 browsers: 191 passed, 1 skipped. `npm run verify` passes.

## Slice 5.1 — build-time timeline

- `src/features/timeline/layout.ts` (pure layout from the collections) and
  `ExperienceTimeline.astro` (SVG above the readable list in `ExperienceList.astro`).
  Rules in `docs/design-spec.md`.
- Checked: Playwright screenshots at 1440×900 beside the concept's worldline (matches:
  lanes, bars, labels, band, graduation line, now, connector, cone); 390×844 scrolls inside
  its frame with no page overflow. A throwaway build with an overlapping role and an ongoing
  role (files deleted) showed the extra row and now moving to the top lane; that exposed the
  cone crossing the axis, fixed by fitting the cone and moving its title below.
- Tests (`timeline.spec.ts`): one bar per listed role in its lane, one time scale matching
  the listed dates and ending by now, drawn without JavaScript, 1440 px fits with text
  ≥ 12 px, phones scroll in the frame with labels ≥ 11 px plus axe on the section. 70 tests
  × 3 browsers: 206 passed, 1 skipped (before a type fix in the new spec; the spec reran
  15/15 after it). `npm run verify` passes.

## Slice 5.2 — selection, details, help

- `src/features/timeline/selection.ts`; `ExperienceList.astro` wraps the list in a
  `data-readout` element and adds the popover; `Section.astro` gained an `aside` slot.
  Decision: the details are the selected list entry (others hidden with JS), not a second
  copy. Rules in `docs/design-spec.md`.
- Checked in the browser at 1440×900 (default selection, band click, hover, keyboard order,
  popover) and with taps at 390×844 (details switch, frame starts at the latest role, no
  page overflow). Found and fixed: the band stole the view on hover; Chromium made the SVG
  itself a tab stop; axe `label-content-name-mismatch` (the two label lines read as one word,
  so no name could match; now one `<text>` with two `<tspan>`s).
- WebKit note: Playwright's auto-scroll to an SVG `<text>` measures it in the wrong place,
  so tests point at a role's hit area by coordinates after scrolling the chart into view;
  hit-testing itself is correct in WebKit.
- Tests (`timeline.spec.ts`): buttons for every entry with label-in-name, default
  selection, click role and band, hover previews roles not the band, keyboard focus order
  and Enter, `#role-…` links, skill links resolve, popover terms and Escape; no-JS shows
  every entry. 78 tests × 3 browsers: 230 passed, 1 skipped. `npm run verify` passes.

## Slice 5.3 — playback

- `src/features/timeline/playback.ts`; controls, cursor and riding dots in
  `ExperienceTimeline.astro` (layout now exports the time scale and role times); intro and
  "now" panels as hidden entries in `ExperienceList.astro`; `selection.ts` gained
  `showPanel`, `setPreview` and an `onUserSelect` hook. Rules in `docs/design-spec.md`.
- Checked with Playwright at 1440×900 with real motion (frames during a sweep, mid-run and
  at the end; controls, chart and details in view at every role; no console errors) and at
  390×844 with and without reduced motion (frame follows the cursor, track hidden under
  reduced motion, Esc stops, no page overflow).
- Tests (fake clock, so a full run takes seconds): roles in start order with the one-screen
  check at each role and faded future roles, ends at "Now" with bars restored; Stop, Esc and
  a role click stop it; hover does not; scrolling away stops it; reduced motion jumps and
  hides the track; no-JS hides the controls. 83 tests × 3 browsers: 245 passed, 1 skipped.
  `npm run verify` passes.

## Slice 6.1 — constellation layout

- `src/features/constellation/layout.ts` and `Constellation.astro` (chart and static
  overview above the readable list in `SkillGroups.astro`); group anchors added to
  `src/data/skill-groups.ts`, carried through `buildSkillIndex`. Rules in
  `docs/design-spec.md`.
- Checked: Playwright screenshots at 1440×900 beside the concept (same arrangement; group
  names larger for the 12 px rule; the overview counts 7 roles where the concept counted the
  6 with skills, matching the section fact); 390×844 scrolls inside its frame. Measured at
  1440: 35 stars, 28 lines, no label overlaps, smallest label 12.2 px.
- Tests (`constellation.spec.ts`): one star per listed skill with size and fill from its
  uses; Σ(n − 1) lines, each joining stars of one group, ≤ 30; no overlapping or clipped
  labels and ≥ 12 px at 1440 and on phones (each browser's own font metrics); phone scroll,
  hint and axe; overview count and most used; drawn without JavaScript. 89 tests × 3
  browsers: 263 passed, 1 skipped (before the swipe hint; the spec reran 18/18 after it).
  `npm run verify` passes.

## Slice 6.2 — selection, filter, cross-links

- `src/features/constellation/selection.ts` (data embedded by `Constellation.astro`); panel,
  filter and star states styled in `Constellation.astro` (script-built panel items under
  `.overview :global(…)`); `explorer.ts` gained a delegated `a[data-visit]` handler sharing
  the project-row logic (`visitFromPage`); `SkillGroups.astro` swaps the header fact for the
  key. Decision: the readable skill list stays visible below the chart (a complete reference;
  the panel shows one skill at a time). Rules in `docs/design-spec.md`.
- Checked with Playwright at 1440×900 (selection, near stars, panel, filter, timeline tag,
  role link, project link opening the visit in place; no console errors) and with a tap at
  390×844 (panel below the chart, no page overflow).
- Tests: `constellation-selection.spec.ts` (buttons and label-in-name; near stars equal the
  skills of the listed projects' stacks and roles' tags; Clear / Escape / empty sky; filter
  dims, untabs and recounts; keyboard focus and most-used buttons; timeline tag twice; role
  link selects in the timeline; axe with a selection; key terms; project link opens the
  visit) plus no-JS checks in `constellation.spec.ts`. 99 tests × 3 browsers: 293 passed,
  1 skipped. `npm run verify` passes.

## Slice 7.1 — contact polish

- `ContactSection.astro`: resume card downloads (`download`) with its size in the tag;
  phone as a `tel:` link; copy-email fallback names the platform's shortcut. A legacy
  `execCommand('copy')` step was tried and dropped (deprecated; it added three type hints for
  browsers the Clipboard API already covers).
- Found and fixed (since 4.1): at 1440 px the closed visit panel, parked 18 px right of its
  open position, widened the page by 2 px. `.hero` now has `overflow-x: clip`. The old
  overflow test only ran at 320 px, where the panel is a bottom sheet.
- Checked at 1440×900 and 390×844 (copy with clipboard permission, layout, no overflow).
- Tests: `contact.spec.ts` (clipboard success in Chromium, which alone can grant the
  permission; selection fallback; download attribute, size label and a real download event;
  `tel:` link) and a 1440 px overflow test in `home.spec.ts` with the explorer running
  (fails without the fix). 105 tests × 3 browsers: 306 passed, 3 skipped.
  `npm run verify` passes.

## Slice 7.2 — black hole

- `src/features/blackhole/shader.ts` (concept shader) and `blackhole.ts` (mount, ambient
  loop, adaptive resolution, context loss); `ContactSection.astro` lazy-loads it and lays out
  the backdrop / banner; `Section.astro` gained a `backdrop` slot and a `class` prop.
- Measured (GPU time per frame with a one-pixel read): RTX 2070, 1080×675 at full quality,
  median 2.5 ms (p90 6.7 ms) — runs at 25 fps. Headless Chromium (SwiftShader) ~1.1 s per
  frame at full quality: detected as software and given one still frame at half resolution;
  with the renderer name hidden, the timing path reaches the same result. Main-thread timer
  gaps stayed ≤ 20 ms in all three cases. The concept's `gl.finish` probe measured 0 ms in
  Chromium, so its fallback could never have fired.
- Checked: desktop backdrop matches the concept (text fully legible; the disk sits right of
  the column), phone banner above the heading, reduced motion gives identical frames, no
  overflow. A mid-range laptop is still unmeasured (Phase 8.2): the plan's ≥ 30 fps target
  vs. the 25 fps ambient cap — the cap wins per the motion rules; the adaptive path covers
  slower GPUs.
- Tests (`blackhole.spec.ts`, phone-sized so real rendering stays cheap; a fake GPU stubs the
  timing read): lazy chunk, decorative and never covering contact links, fast GPU runs at
  1.00 and pauses off screen, slower GPU steps to 0.50, too-slow GPU gets a still frame,
  reduced motion, no WebGL and a failing shader leave no backdrop. 112 tests × 3 browsers:
  327 passed, 3 skipped (then a typing fix in the new spec; it reran 21/21).
  `npm run verify` passes.

## Slice 7.3 — 404

- `BlackHole.astro` now holds the figure, loader and placement (Contact loads it when near,
  `eager` loads at once); `ContactSection.astro` uses it; `src/pages/404.astro` adds it behind
  the line.
- Checked on the real GPU at 1440×900 and 390×844 on a nested missing path (404 status,
  running, no overflow, no errors) and Contact after the extraction.
- Tests (`not-found.spec.ts`): draws at once and decorative, link clickable over it, no
  overflow and axe at 1440; banner above the line on phones; no WebGL keeps line and link.
  115 tests × 3 browsers: 336 passed, 3 skipped. `npm run verify` passes.

## CI follow-up to Phase 7

- The first deploy of 1576687 was cancelled: "Install Playwright browsers" hung on the runner
  for the job's whole 20 minutes (no tests ran). The re-run failed 7 Firefox tests: CI's
  Linux Firefox has no WebGL, so the black hole correctly never draws, but the black hole and
  404 tests waited for it. They now skip without WebGL (`supportsWebGL` in `helpers.ts`), as
  the explorer tests already did; checked locally in Firefox with `webgl.disabled` (7 skipped,
  4 passed, including the no-WebGL fallback). Also seen once on CI: `visits › a project row
scrolls up and opens the visit` timed out in Chromium and passed on retry (watch it in
  Phase 8).

## CI in the Playwright container

- `ci.yml` runs the quality job in `mcr.microsoft.com/playwright:v1.64.1-noble` (pinned by
  digest, `--user 1001 --ipc=host`); the browser step is a no-op there and nothing uses the
  apt mirror. Keep the tag equal to `@playwright/test`. Validated on a branch first: it
  surfaced two slow-runner test issues, now fixed (constellation attributes read in one call;
  Play clicks skip the stability wait under WebKit's fake clock). Test step ~7–9 min.

## Slice 8.1 — accessibility audit

- Results and method in `docs/accessibility-audit.md`. Fixed: target sizes (stars, landing
  dots, phone planet labels, summaries, nav and phone links); instant visits stuck at
  "flying" when the explorer was paused (`finishTransition` in `explorer.ts`; the recurring CI
  flake in the row-visit test). `settled` now passes on pages without a hero.
- Tests: target size at 1440 and 390 on home, a project page and the 404; reduced-motion
  visit while paused (fails without the fix).
- Outstanding: the NVDA / VoiceOver pass (needs Sebastian or a machine with them).

## Slice 8.2 — performance budgets

- `scripts/check-budgets.mjs` (`npm run budgets`, in `verify` and CI) and
  `scripts/lighthouse.mjs` (`npm run lighthouse`, CI step with a job-summary table). Uses the
  `lighthouse` package directly: `@lhci/cli` 0.15.1 adds 17 advisories (11 high) and CI runs
  `npm audit --audit-level=high`.
- Sizes: initial JS 9.6 KB gzip (404: 3.9 KB); explorer 140 KB gzip; heaviest visit
  (Eigenflow) 1.52 MB.
- Lighthouse first measured LCP 3.3 s (home) and 3.1 s / CLS 0.28 (Eigenflow). Fixed:
  stylesheets inlined (two render-blocking requests, ~600 ms); the project-page hand-off no
  longer paints the intro (it set the LCP at the moment the explorer mounted); the static
  visit is top-aligned and its meta row stacks on phones (a font swap made the row wrap and
  shifted the page, CLS 0.27). Throttling is applied during the run: simulated throttling
  times an explorer label on project pages, because unthrottled the explorer takes over
  before the visit paints.
- Now (median of 3): home LCP ~0.9–1.2 s, CLS 0.003; Eigenflow LCP ~2.0–2.25 s, CLS 0
  (locally and in CI). Eigenflow has ~0.25–0.45 s of LCP headroom.
- Found, not fixed: on software WebGL (CI; GPU-less or blocklisted machines) the explorer's
  60 fps loop never lets the main thread idle, so Lighthouse cannot compute TBT or a score
  there (printed as n/a). The black hole already falls back to a still frame on software
  renderers; the explorer should too (8.3). With a GPU, TBT is ~0.15–0.8 s.

## Slice 8.3 — cross-browser and devices

- Explorer on software WebGL: still mode (`src/features/gpu.ts`, shared with the black hole;
  `ambientLoop` gained `still`). Measured on SwiftShader at 4× CPU: long tasks 28% → 0%,
  page 26 → 60 fps. Motion tests hide the renderer name (`asIfGpu` in `helpers.ts`); a new
  test forces a software name and checks the system holds still and visits arrive at once.
- Engine and device results in `docs/browser-device-pass.md`: all three engines render
  every section; emulated iPhone 13 and Pixel 7 tap through explorer, timeline and stars.
  The first timeline-tap reading ("no") was a script error (role scrolled out of its frame).
- Outstanding (needs Sebastian): real Safari / iOS / Android, WebM playback on Safari (no
  ffmpeg here for an MP4), mid-range performance, the screen-reader pass.
- Tests: 117 tests × 3 browsers: 348 passed, 3 skipped. `npm run verify` passes.
- CI (Lighthouse, GPU-less runner): TBT and the score are now measurable because the
  explorer idles on software WebGL — home TBT ~0.8 s / score 81, Eigenflow ~0.9 s / 77;
  LCP and CLS unchanged. Watch: `contact › without clipboard access…` failed once on CI (status
  stayed empty) and passed on retry; not reproduced locally.

## Slice 8.4 — SEO and sharing

- `BaseLayout.astro` head (canonical, Open Graph, Twitter, JSON-LD, icons, manifest,
  theme colour); `src/lib/seo.ts` builds the JSON-LD only from `site.ts` and project entries
  (`role` moved into `site.ts` for the home title and `jobTitle`); endpoints `sitemap.xml`,
  `robots.txt`, `site.webmanifest`; scripts `og-images.mjs` (`npm run og`) and `icons.mjs`
  (`npm run icons`) with their outputs committed (six cards ~75–95 KB; favicon.ico 16/32,
  apple-touch-icon 180, icons 192/512).
- After adding or renaming a project, or changing the hero: `npm run og`, then rebuild; the
  SEO test fails if a page has no image of its own.
- Tests (`seo.spec.ts`): canonical and sharing tags per page, a 1200×630 JPEG per page,
  JSON-LD agreeing with the visible name, contact links and source links, sitemap = the
  site's pages (each 200), robots.txt → sitemap, icons and manifest sizes, 404 untagged,
  `noindex` kept. 122 tests × 3 browsers: 363 passed, 3 skipped. `npm run verify` passes.

## Next task

Phase 8, slice 8.5 — GitHub data refresh: a script that updates `src/data/github.json` (last
commit, lines of code) and a scheduled workflow that opens a PR when it changes. Real-device
checks and the screen-reader pass remain with Sebastian.

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
- **Font weight:** kept the opsz Newsreader (budgets pass with applied throttling); switching
  to weight-only would improve PageSpeed Insights' simulated LCP (home ~3.2 → ~2.4 s) at the
  cost of a wider hero. Sebastian's call (8.2).
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
