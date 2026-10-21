# Current handoff

## Current state

**Phase 1, slice 1.1 (content model) is done** on branch `feat/content-model`, branched from
`docs/plan-v2` (not merged yet). Next is slice 1.2. The visual source of
truth stays `references/concept/orbit-concept-v19.html` and `docs/design-spec.md`; the
phased plan is `tasks/plan.md` (v2).

## What changed in slice 1.1

- `src/content.config.ts`: strict Zod schemas for `projects` (Markdown), `experience` and
  `education` (YAML). Unknown keys, unknown skills, bad `YYYY-MM` dates, `end` before
  `start`, wrong media file types and repos missing from the snapshot all fail the build.
- Content migrated from the concept: 5 projects, 7 roles, University of Miami, site profile
  with earlier-work repos (`src/data/site.ts`), skill groups (`src/data/skill-groups.ts`,
  35 skills), GitHub snapshot (`src/data/github.json`, hand-entered from the concept).
- `src/lib/content.ts`: `getProjects()` (joins snapshot, newest commit first, unique tour
  positions), `getRoles()`, `getEducation()`. The draft example is gone; the placeholder
  page now lists the 5 real projects.
- `docs/content.md` updated to match.

Verification: `npm run verify` passes (0 errors/warnings/hints). Each validation rule was
broken once on purpose and the build failed with a clear message; restoring it passed.

## Next task

Phase 1, slice 1.2 — design tokens in `src/styles/tokens.css` and self-hosted fonts via
Fontsource (see `tasks/plan.md`).

## Open inputs and issues

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
