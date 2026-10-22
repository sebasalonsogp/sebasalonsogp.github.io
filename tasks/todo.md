# Delivery checklist

Work one slice at a time (see `plan.md` for acceptance criteria). Update `docs/handoff.md`
before ending a session.

## Phase 0 — Foundation ✓

- [x] Astro static shell, strict TypeScript, CI checks, phased plan, references.

## Design — approved concept ✓

- [x] Interactive concept approved (`references/concept/orbit-concept-v19.html`).
- [x] Design spec written (`docs/design-spec.md`).

## Phase 1 — Content model, readable site, Pages pipeline ✓

- [x] 1.1 Collections: projects, experience, education, skills groups, site profile; migrate real content.
- [x] 1.2 Tokens and self-hosted fonts.
- [x] 1.3 Page skeleton: nav, hero text, projects, experience list, skills lists, contact, footer.
- [x] 1.4 Static `/projects/<id>/` routes.
- [x] 1.5 Playwright + axe harness with first tests.
- [x] 1.6 GitHub Pages workflow (tests gate deploy), `noindex`, resume PDF, plain 404; verify direct loads live.
- [x] Checkpoint: review the live readable site (approved by moving on to Phase 2).

## Phase 2 — Sky and visual system ✓

- [x] 2.1 Sky module (stars, twinkle, haze 0.024, parallax).
- [x] 2.2 Shared motion policy (reduced motion, visibility pause, fps cap).
- [x] 2.3 Visual pass: type rules, headings, focus, contrast over the sky (popovers move to 3.4, 5.2, 6.2).
- [x] Checkpoint: look and feel (approved).

## Phase 3 — Solar-system explorer ✓

- [x] 3.1 Three.js scene shell with lazy load and fallback.
- [x] 3.2 Data-driven bodies: star, orbits, procedural planets, rings, moons, belt.
- [x] 3.3 HTML labels, drag, hover, select, list ↔ planet highlight.
- [x] 3.4 Hero key popover.
- [x] Checkpoint: explore on desktop and phone (approved).

## Phase 4 — Visit, land, return (in progress)

- [x] 4.1 Visit state machine and panel.
- [x] 4.2 Landing previews, video, lightbox.
- [x] 4.3 Routes, history, direct load, focus.
- [x] 4.4 Tour.
- [x] 4.5 Journey tests.
- [ ] Checkpoint: full journey, shared link on a phone.

## Phase 5 — Experience timeline

- [x] 5.1 Build-time SVG timeline.
- [x] 5.2 Selection, details, skill links, help popover.
- [x] 5.3 Playback.

## Phase 6 — Skills constellation

- [x] 6.1 Build-time layout and group lines.
- [x] 6.2 Overview, light-up selection, filter, cross-links.

## Phase 7 — Contact, black hole, 404

- [ ] 7.1 Contact polish and resume download.
- [ ] 7.2 Black hole (lazy, adaptive, fallback).
- [ ] 7.3 404 page.

## Phase 8 — Quality

- [ ] 8.1 Accessibility audit.
- [ ] 8.2 Performance budgets + Lighthouse CI.
- [ ] 8.3 Cross-browser and device pass.
- [ ] 8.4 SEO, Open Graph, sitemap, structured data.
- [ ] 8.5 GitHub data refresh automation.
- [ ] 8.6 Analytics (optional).

## Phase 9 — Launch

- [ ] 9.1 Final content review and missing screenshots.
- [ ] 9.2 Remove `noindex`, domain, tag v1.0.0.
- [ ] 9.3 Live verification and rollback notes.
