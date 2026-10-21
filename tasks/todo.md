# Delivery checklist

Work one slice at a time (see `plan.md` for acceptance criteria). Update `docs/handoff.md`
before ending a session.

## Phase 0 — Foundation ✓

- [x] Astro static shell, strict TypeScript, CI checks, phased plan, references.

## Design — approved concept ✓

- [x] Interactive concept approved (`references/concept/orbit-concept-v19.html`).
- [x] Design spec written (`docs/design-spec.md`).

## Phase 1 — Content model, readable site, Pages pipeline (next)

- [x] 1.1 Collections: projects, experience, education, skills groups, site profile; migrate real content.
- [x] 1.2 Tokens and self-hosted fonts.
- [x] 1.3 Page skeleton: nav, hero text, projects, experience list, skills lists, contact, footer.
- [x] 1.4 Static `/projects/<id>/` routes.
- [x] 1.5 Playwright + axe harness with first tests.
- [x] 1.6 GitHub Pages workflow (tests gate deploy), `noindex`, resume PDF, plain 404; verify direct loads live.
- [ ] Checkpoint: review the live readable site.

## Phase 2 — Sky and visual system

- [ ] 2.1 Sky module (stars, twinkle, haze 0.024, parallax).
- [ ] 2.2 Shared motion policy (reduced motion, visibility pause, fps cap).
- [ ] 2.3 Visual pass: type rules, headings, help popovers, focus.
- [ ] Checkpoint: look and feel.

## Phase 3 — Solar-system explorer

- [ ] 3.1 Three.js scene shell with lazy load and fallback.
- [ ] 3.2 Data-driven bodies: star, orbits, procedural planets, rings, moons, belt.
- [ ] 3.3 HTML labels, drag, hover, select, list ↔ planet highlight.
- [ ] 3.4 Hero key popover.
- [ ] Checkpoint: explore on desktop and phone.

## Phase 4 — Visit, land, return

- [ ] 4.1 Visit state machine and panel.
- [ ] 4.2 Landing previews, video, lightbox.
- [ ] 4.3 Routes, history, direct load, focus.
- [ ] 4.4 Tour.
- [ ] 4.5 Journey tests.
- [ ] Checkpoint: full journey, shared link on a phone.

## Phase 5 — Experience timeline

- [ ] 5.1 Build-time SVG timeline.
- [ ] 5.2 Selection, details, skill links, help popover.
- [ ] 5.3 Playback.

## Phase 6 — Skills constellation

- [ ] 6.1 Build-time layout and group lines.
- [ ] 6.2 Overview, light-up selection, filter, cross-links.

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
