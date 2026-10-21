# Current handoff

## Current state

**Phase 1, slices 1.1–1.3 are done** on stacked branches: `feat/content-model` (1.1) →
`feat/tokens-fonts` (1.2) → `feat/page-skeleton` (1.3), all on `docs/plan-v2`; none
merged yet. Next is slice 1.4.
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

## Next task

Phase 1, slice 1.4 — static `/projects/<id>/` routes via `PortfolioPage` with an
initial project; make project rows link to them. Decide media first (see below).

## Open inputs and issues

- **Font weight:** Newsreader with the opsz axis (as specified) is 129 KB per face vs 57 KB
  weight-only. Revisit in Phase 8 if LCP needs it. No fallback metric overrides yet (CLS
  check in Phase 8).
- Resume links point to `Sebastian_Gonzales_Portillo_Resume.pdf`, which arrives in 1.6;
  until then they 404.
- **Phone:** `showPhone` is `true` (as in the approved concept). The number is stored in
  `src/data/site.ts`, so it becomes public with the repository in slice 1.6 whatever the
  flag says. Decide before 1.6.
- **Media timing:** slice 1.4 asks for media on project routes, but copying media is
  scheduled for Phase 4.2. Either copy the files in 1.4 or render 1.4 without media.
- SVD Lens and Exoplanet share `lastCommit` 2026-09-15; ties sort by id, so Exoplanet
  orbits inside SVD Lens (the concept had the reverse). Real commit times from the sync
  script (Phase 8) would settle it.
- Final pitch (draft in use); PadStats title on LinkedIn ("Software Engineer") vs resume
  ("Founding Software Engineer"); screenshots for SVD Lens and the real Wine Journal app;
  confirm repository name `sebasalonsogp.github.io` before 1.6.

## Media sources

Copy from the project repositories: Eigenflow `docs/media/*`, Exoplanet
`docs/assets/dashboard-preview.png`, Quantum `assets/quantum-playground-demo.png`, Wine
Journal `design/prototype-v3/checks/desktop-my-wines.png` (labeled as prototype). The
concept's crops: Eigenflow experiment (80,120)–(1360,920), Quantum top 1440×900, Wine
Journal top 1024×640; poster frame at 2 s of the Eigenflow video. File names must match the
`media` entries in `src/content/projects/`.

## Session start checklist

Read `AGENTS.md`, this file, `PRODUCT.md`, `docs/design-spec.md` and the current item in
`tasks/todo.md`; inspect `git status` and recent commits before editing.
