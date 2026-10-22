# Implementation plan — v2 (approved concept)

Status: replaces the v1 phase list. Phase 0 (foundation) is complete and unchanged.
Visual source of truth: `references/concept/orbit-concept-v19.html` (open it in a browser) and
`docs/design-spec.md`. Where they disagree, the design spec wins; where the spec is silent,
match the concept.

## How we work

- **Phases → slices.** Each phase is a set of small slices. One slice = one focused branch,
  one reviewable change, `npm run verify` green, handoff updated.
- **Deploy from Phase 1.** Every merge to `main` deploys to GitHub Pages with
  `noindex` until launch, so each checkpoint is reviewed on the real URL and base-path,
  refresh and 404 problems surface on day one.
- **Readable first, then enhanced.** All text, links and navigation are real HTML before any
  canvas exists. Graphics are progressive enhancement and never the only way to reach
  content.
- **Checkpoints.** A phase ends with a review by Sebastian on the deployed site (desktop and
  phone). The next phase starts after approval. Within a phase, routine choices are
  delegated.
- **Port, don't paste.** The concept is a single prototype file. Port behavior and values
  into typed modules; do not copy the file into `src/`.

### Definition of done (every slice)

1. `npm run verify` passes (format, Astro + TypeScript checks, build).
2. Playwright suite passes once it exists (Phase 1 onward), including the slice's new tests.
3. Checked in a real browser at 1440×900 and 390×844, with keyboard only, and with
   `prefers-reduced-motion: reduce`.
4. No console errors. No horizontal scroll at 320 px.
5. `tasks/todo.md` and `docs/handoff.md` updated with what changed, results and next slice.

## Phase overview

| Phase | Outcome                                            | Depends on | Checkpoint           |
| ----- | -------------------------------------------------- | ---------- | -------------------- |
| 0     | Foundation (done)                                  | —          | ✓                    |
| 1     | Content model, readable site, Pages pipeline       | 0          | Live readable site   |
| 2     | Twinkling sky and visual system                    | 1          | Look and feel        |
| 3     | Solar-system explorer (Three.js)                   | 2          | Explore              |
| 4     | Visit, land, return, routes, tour                  | 3          | Full project journey |
| 5     | Experience timeline                                | 1          | Timeline + playback  |
| 6     | Skills constellation                               | 1, 5       | Constellation        |
| 7     | Contact, black hole, 404                           | 2          | End of page          |
| 8     | Quality: accessibility, performance, browsers, SEO | 1–7        | Release candidate    |
| 9     | Launch                                             | 8          | Public site          |

Phases 5–7 only need Phase 1 (and 2 for visuals), so they can run before or alongside 3–4
if the explorer needs more time.

---

## Phase 1 — Content model, readable site, Pages pipeline

**Goal:** every word, link and section of the final site exists as semantic HTML driven by
validated content, deployed to GitHub Pages.

Slices:

1. **Content model.** Implement the collections in `docs/content.md`: `projects`
   (Markdown), `experience` and `education` (data), `skills` groups, and `site` profile.
   Migrate the real content from the concept (5 projects, 7 roles, education, earlier repos,
   contact). Zod schemas with strict types. Remove the draft example.
2. **Design tokens and fonts.** Port tokens to `src/styles/tokens.css` (warm-star palette,
   type scale, spacing, motion durations). Self-host Newsreader, Schibsted Grotesk and IBM
   Plex Mono via Fontsource (subset Latin, `font-display: swap`).
3. **Page skeleton.** `BaseLayout` with nav (Projects, Experience, Skills, Contact, Resume),
   hero text and CTAs, Projects list (+ earlier work), Experience as an accessible list,
   Skills as grouped lists, Contact (email + copy, phone, location, resume, LinkedIn,
   GitHub), footer. Reserve the hero canvas area. No graphics yet.
4. **Static project routes.** `/projects/<id>/` pages generated from the collection with
   the full write-up (short version + engineering log), stack, links and media. These are
   the canonical URLs the explorer will use later.
5. **Test harness.** Add Playwright (Chromium, Firefox, WebKit) and `@axe-core/playwright`.
   First tests: every section and nav link reachable; project routes load directly; no axe
   violations; resume and external links present.
6. **GitHub Pages deploy.** Create the repository (name confirmed with Sebastian), set
   `site`/`base`, add the Pages workflow (verify + Playwright gate the deploy), `noindex`
   until launch, resume PDF in `public/`, a plain `404.html`. Verify direct load and refresh
   of `/projects/<id>/` on the live URL.

**Acceptance:** The live Pages URL shows a complete, readable portfolio with JavaScript
disabled. All content comes from the collections. Lighthouse accessibility ≥ 95. Adding a
project Markdown file adds a list row and a route with no code change.

**Checkpoint:** Sebastian reviews copy and structure on the live URL.

## Phase 2 — Twinkling sky and visual system

**Goal:** the approved atmosphere: near-black void, haze level B, visibly twinkling stars,
type and color applied everywhere.

Slices:

1. **Sky module.** Port the generated sky to `src/features/sky/` as a fixed 2D canvas:
   magnitude distribution, temperature colors, density 1 star / 520 px², twinkle by
   scintillation (stronger near the bottom), Milky Way haze at strength 0.024, slight
   parallax with scroll and explorer yaw. Seeded and deterministic.
2. **Motion policy.** One shared `motion.ts`: reduced-motion detection, page-visibility
   pause, 30 fps cap for ambient loops. Reduced motion renders a single static sky.
3. **Visual pass.** Apply the type rules (mono only for dates and data), section headings
   (`sec-top`), buttons, focus rings, scroll margins. "How to read" popovers ship with the
   graphics they explain (3.4, 5.2, 6.2), so none describes something not yet built.

**Acceptance:** Twinkle is clearly visible on a recorded 10-second clip at desktop and
phone sizes. Sky costs < 2 ms/frame on a mid-range laptop. Text contrast ≥ 4.5:1
everywhere (measured).

**Checkpoint:** look and feel on the live URL.

## Phase 3 — Solar-system explorer

**Goal:** the hero system, data-driven, rotatable, and accessible.

Slices:

1. **Scene shell.** Install `three`. `src/features/explorer/`: renderer, camera, resize,
   dispose, visibility pause, WebGL-failure fallback (the HTML list stays). Lazy-load after
   first paint so hero text is the LCP element.
2. **Bodies from data.** Star (Sebastian), orbits ordered by last commit, planet size from
   lines of code (log scale), procedural surfaces per domain (rocky, banded, ocean, ice) as
   shaders, rings for live demos, moons for subsystems, outer belt. All from the
   collection plus `src/data/github.json` (committed snapshot; see Phase 8 for automation).
3. **Labels and interaction.** HTML labels positioned over the canvas (collision-avoiding,
   on-screen), drag to rotate, hover highlight, click to select, idle slow rotation,
   project-list hover highlights the planet. Keyboard: the project list and labels are
   real buttons.
4. **Hero key popover** ("How to read the system").

**Acceptance:** Adding or removing a project changes the system with no scene-code edits.
60 fps on a mid-range laptop, ≥ 30 fps on a recent phone. Works with mouse, touch and
keyboard; WebGL disabled shows the readable hero and list.

**Checkpoint:** explore the system on desktop and phone.

## Phase 4 — Visit, land, return, routes, tour

**Goal:** the full project journey, shareable by URL.

Slices:

1. **Visit state machine.** `explore → flying → visit → returning` with interruptible
   camera transitions (fly 1.9 s, hop 2.3 s, return 1.5 s; instant with reduced motion).
   Visit panel with short version / engineering log tabs, live-demo and source actions,
   stack tags, previous/next.
2. **Landing previews.** When a project has media: planet moves up-left, the preview screen
   fades in below; video autoplays muted (poster when reduced motion); lightbox with
   arrows, Esc and focus trap. Phones show the preview inside the panel. Images through
   `astro:assets` (responsive WebP/AVIF); video from `public/media/`.
3. **Routing and history.** Visiting pushes `/projects/<id>/`; Back returns to explore;
   loading `/projects/<id>/` directly opens that visit (the static page from Phase 1 is
   the no-JS fallback). Focus moves to the panel title and returns to the trigger.
4. **Tour.** "Take the 60-second tour" visits three projects with a progress bar; any
   interaction stops it.
5. **Tests.** Playwright: visit from planet and list, tabs, lightbox, Esc order (lightbox
   then visit), Back/Forward, direct load, tour stop, reduced motion.

**Acceptance:** Every project is reachable, readable and shareable by URL with and without
the 3D scene. Refreshing any project URL on Pages works.

**Checkpoint:** full journey review, including sending a project link to a phone.

## Phase 5 — Experience timeline

**Goal:** the four-lane worldline with playback, built from data.

Slices:

1. **Static SVG timeline** rendered at build time from `experience` and `education`:
   lanes, role bars, college band, now line, light cone, labels. The accessible list from
   Phase 1 stays as the screen-reader and no-JS version.
2. **Interaction.** Select a role or the college band to show details below; skill tags
   link to the constellation; "How to read this" popover.
3. **Playback.** Time cursor eases between role starts (0.9–2.6 s per segment), roles draw
   as the cursor passes with riding dots, 4.6 s dwell per role, reveal of now + light cone,
   stop on any interaction or Esc; phones follow the cursor horizontally.

**Acceptance:** Adding a role in data updates the chart with no code change. Playback
keeps chart, controls and details on one screen at 1440×900.

## Phase 6 — Skills constellation

**Goal:** the grouped constellation with overview and light-up selection.

Slices:

1. **Build-time layout.** Compute skills from projects and roles, group by
   `skills` groups, spiral layout per group, label de-overlap, shortest-tree group lines.
   Output static SVG (no layout work in the browser).
2. **Interaction.** Overview panel (count, groups, most used), select lights up co-used
   skills, filter All/Projects/Experience, clear, links to projects and roles; timeline tags
   focus a star. "How to read this" popover.

**Acceptance:** ≤ 30 resting lines; every label ≥ 12 px on desktop; no overlapping labels
(checked by a test that measures label boxes).

## Phase 7 — Contact, black hole, 404

Slices:

1. **Contact polish.** Copy email with fallback selection, mail link, resume download
   (`download` attribute), links.
2. **Black hole.** Port the ray-traced lensing shader to `src/features/blackhole/` (raw
   WebGL or a Three.js full-screen quad), lazy-loaded when Contact nears the viewport,
   adaptive resolution, pause off-screen, single frame for reduced motion, hidden without
   WebGL. Desktop backdrop with left fade; phone banner above Contact.
3. **404 page.** "This page fell past the event horizon." with the black hole and a link
   home.

**Acceptance:** Black hole holds ≥ 30 fps on a mid-range laptop at full resolution or
degrades gracefully; never blocks reading or interacting with contact details.

## Phase 8 — Quality

Slices:

1. **Accessibility audit** (WCAG 2.2 AA): keyboard paths, focus order, screen-reader pass
   (VoiceOver + NVDA), contrast, touch targets, reduced motion.
2. **Performance.** Budgets: LCP ≤ 2.5 s and CLS ≤ 0.1 on a throttled mobile profile;
   initial JS ≤ 60 KB gzip before the explorer loads; explorer chunk ≤ 200 KB gzip; total
   media per visit ≤ 2 MB. Lighthouse CI in the workflow.
3. **Cross-browser** Chromium, Firefox, Safari (desktop + iOS), Android Chrome.
4. **SEO and sharing.** Titles, descriptions, Open Graph image, canonical URLs, sitemap,
   structured data (Person), favicon set.
5. **GitHub data automation.** Script to refresh `src/data/github.json` (last commit,
   lines of code) and a scheduled workflow that opens a PR when it changes.
6. **Analytics (optional).** Privacy-friendly page and tour/visit events (GoatCounter or
   Cloudflare Web Analytics).

## Phase 9 — Launch

1. Final content review: pitch, phone number on/off, PadStats title alignment with
   LinkedIn, resume version, screenshots for SVD Lens and Wine Journal.
2. Remove `noindex`, optional custom domain (DNS + HTTPS), tag `v1.0.0`.
3. Live verification checklist and rollback steps recorded in `docs/deployment.md`.

---

## Content inputs (needed by the phase shown)

| Input                             | Needed by                  | Status                                |
| --------------------------------- | -------------------------- | ------------------------------------- |
| Final one-line pitch              | 1 (placeholder ok until 9) | Draft in place                        |
| Phone number public?              | 1                          | Included, confirm at 9                |
| Resume PDF for the site           | 1                          | Current resume in hand                |
| Repository name / domain          | 1.6                        | Recommended `sebasalonsogp.github.io` |
| SVD Lens screenshot or clip       | 4                          | Missing                               |
| Wine Journal real-app screenshots | 4                          | Prototype only                        |
| PadStats title on LinkedIn        | 9                          | Mismatch                              |

## Risks and responses

| Risk                               | Response                                                                                  |
| ---------------------------------- | ----------------------------------------------------------------------------------------- |
| Explorer takes longer than planned | Phases 5–7 can proceed; the readable site is already live.                                |
| 3D cost on phones                  | Measure in Phase 3; reduce pixel ratio, texture size and effects before cutting features. |
| Black hole too heavy on weak GPUs  | Adaptive resolution; skip entirely below a measured threshold.                            |
| Pages refresh/base-path bugs       | Deploy from Phase 1; Playwright direct-load tests on the built site.                      |
| Concept drift                      | Spec is the contract; any visual change gets a spec update in the same PR.                |
