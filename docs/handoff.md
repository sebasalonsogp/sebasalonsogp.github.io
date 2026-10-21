# Current handoff

## Current state

**Phase 1, slices 1.1–1.5 are done** on stacked branches: `feat/content-model` (1.1) →
`feat/tokens-fonts` (1.2) → `feat/page-skeleton` (1.3) → `feat/project-routes` (1.4) →
`test/playwright-harness` (1.5) → `deploy/github-pages` (1.6, local part), all on
`docs/plan-v2`; none merged or pushed. There is no remote yet.
The visual source of truth stays `references/concept/orbit-concept-v19.html` and
`docs/design-spec.md`; the phased plan is `tasks/plan.md` (v2).

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

## Slice 1.6 — Pages deploy (local part)

- `astro.config.mjs`: `site: 'https://sebasalonsogp.github.io'`, `base: '/'`.
- `src/pages/404.astro`: plain "This page fell past the event horizon." with a link home
  (black hole in 7.3). Test checks the 404 status and the way back.
- `deploy.yml` (check → build → deploy) reuses `ci.yml`; see `docs/deployment.md`.
- `npm run verify` passes; `npm test` 17 × 3 = 51 passed.

## Next task

Finish slice 1.6. Needs Sebastian first: (1) confirm repository name
`sebasalonsogp.github.io` (public, required for a free Pages user site), (2) the resume
PDF for `public/Sebastian_Gonzales_Portillo_Resume.pdf`, (3) phone shown or hidden (the
number becomes public with the repository either way unless removed from `site.ts`).
Then: create the repository with `gh`, merge the stacked branches into `main`, push, set
Pages source to GitHub Actions, watch the deploy, and check the live URL (home, a project
direct load and refresh, 404, resume, one demo link).

## Open inputs and issues

- **WebKit + WebM:** Playwright's Windows WebKit never fires `load` on a page with a real
  WebM video (any markup; Chromium is fine), so tests wait for `domcontentloaded`. Confirm
  the Eigenflow page on real Safari/iOS in Phase 8.3; an MP4 (H.264) source in Phase 4.2
  would be the safe fallback. WebKit also keeps links out of the Tab order (Safari
  default), so the skip-link test focuses the link directly there.
- **axe "incomplete" (needs a human):** `color-contrast` on some elements (measure in 2.3)
  and `video-caption` for the Eigenflow demo; no captions are needed if the recording is
  silent. Confirm.

- **Font weight:** Newsreader with the opsz axis (as specified) is 129 KB per face vs 57 KB
  weight-only. Revisit in Phase 8 if LCP needs it. No fallback metric overrides yet (CLS
  check in Phase 8).
- Resume links point to `Sebastian_Gonzales_Portillo_Resume.pdf`, which arrives in 1.6;
  until then they 404.
- **Phone:** `showPhone` is `true` (as in the approved concept). The number is stored in
  `src/data/site.ts`, so it becomes public with the repository in slice 1.6 whatever the
  flag says. Decide before 1.6.
- Eigenflow's page stacks three media items before the text on phones; Phase 4.2's
  carousel (dots + lightbox) should replace the stack.
- SVD Lens and Exoplanet share `lastCommit` 2026-09-15; ties sort by id, so Exoplanet
  orbits inside SVD Lens (the concept had the reverse). Real commit times from the sync
  script (Phase 8) would settle it.
- Final pitch (draft in use); PadStats title on LinkedIn ("Software Engineer") vs resume
  ("Founding Software Engineer"); screenshots for SVD Lens and the real Wine Journal app;
  confirm repository name `sebasalonsogp.github.io` before 1.6.

## Media sources

In the repo now (copied from the concept's crops). Originals for later replacement live in
the project repositories: Eigenflow `docs/media/*`, Exoplanet
`docs/assets/dashboard-preview.png`, Quantum `assets/quantum-playground-demo.png`, Wine
Journal `design/prototype-v3/checks/desktop-my-wines.png` (prototype). Still missing: SVD
Lens (none) and real Wine Journal screenshots.

## Session start checklist

Read `AGENTS.md`, this file, `PRODUCT.md`, `docs/design-spec.md` and the current item in
`tasks/todo.md`; inspect `git status` and recent commits before editing.
