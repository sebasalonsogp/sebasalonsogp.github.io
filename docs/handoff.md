# Current handoff

## Current state

**Design approved; build starts at Phase 1, slice 1.1.** Phase 0 (foundation) is complete.
The interactive concept went through 19 reviewed iterations and is the visual source of
truth: `references/concept/orbit-concept-v19.html`. Its exact values, copy and behavior are
captured in `docs/design-spec.md`. The phased build plan is `tasks/plan.md` (v2).

## What changed in this planning session

- Plan v2 replaces the v1 phases: content-first readable site deployed to GitHub Pages in
  Phase 1, then sky, explorer, visit/landing/routes, timeline, constellation, black hole,
  quality and launch.
- New `docs/design-spec.md`. Updated `docs/architecture.md`, `docs/content.md`,
  `docs/deployment.md`, `PRODUCT.md`.
- Real content is now known (see the concept): 5 pinned projects from
  github.com/sebasalonsogp, 7 roles from the resume and LinkedIn, University of Miami dual
  degree (cum laude, May 2025), contact details and resume.

## Next task

Phase 1, slice 1.1 — implement the content collections in `docs/content.md` and migrate
the content from the concept's data (`PROJECTS`, `ROLES`, education, earlier work, contact).
Keep the readable page minimal until slice 1.3.

## Open inputs (none block Phase 1)

- Final pitch (draft in use), phone number public or not, PadStats title on LinkedIn
  ("Software Engineer") vs resume ("Founding Software Engineer").
- Screenshots: SVD Lens (none) and Wine Journal real app (only prototype images exist).
- Confirm repository name `sebasalonsogp.github.io` before slice 1.6 creates it.

## Media sources

Copy into the repo during Phase 4.2 from the project repositories: Eigenflow
`docs/media/*`, Exoplanet `docs/assets/dashboard-preview.png`, Quantum
`assets/quantum-playground-demo.png`, Wine Journal `design/prototype-v3/checks/desktop-my-wines.png`
(labeled as prototype). The concept's crops: Eigenflow experiment (80,120)–(1360,920),
Quantum top 1440×900, Wine Journal top 1024×640; poster frame at 2 s of the Eigenflow video.

## Session start checklist

Read `AGENTS.md`, this file, `PRODUCT.md`, `docs/design-spec.md` and the current item in
`tasks/todo.md`; inspect `git status` and recent commits before editing.

## After pulling these docs

They were written outside the toolchain. Run `npm run format` once, then `npm run verify`, and commit the result before starting slice 1.1.
