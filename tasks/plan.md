# Phased implementation plan

## Outcome and method

Build a lean, custom outer-space portfolio for hiring managers and engineers. It must communicate backend/AI/ML/data-science work clearly, make contact easy, and feature a rotatable project system with **Explore → Visit → Read → Land → Return** navigation.

Use the supplied Stitch composition and confirmed additions as the baseline. Deliver one reviewable slice at a time. Complete the current phase's evidence before expanding its design across the site. A later task can refine a previous phase; this is a sequence of checkpoints, not a waterfall freeze.

The user has authorized Phase 0 now. Later phases guide subsequent work rather than authorizing a full build in this session. Small engineering choices within a requested slice are delegated. A visual checkpoint is a concrete local browser review, not another abstract layout interview.

## Portfolio structure to preserve

1. Compact navigation and an opening composition that establishes identity and specialty.
2. The solar-system explorer as the primary visual element, with a readable project index and direct project destinations.
3. Experience with verified roles and contributions; use the reference's restrained timeline where appropriate.
4. About/technical focus with skills supported by project evidence.
5. Contact, professional links, and resume when supplied.

Writing is optional and requires real material. No invented articles, proficiency meters, project metrics, or employment claims. Reconcile the explorer's increased prominence with the reference during Phase 1; do not replace the composition with an unrelated generic hero/card template.

## Phase 0 — Portable foundation (current scope)

**Deliver:** a project container matching its neighbors, an independent `repo/`, maintained product/architecture/plan/handoff files, original reference essentials, an Astro development shell, strict types, a validated draft project entry, formatting, reproducible dependencies, and CI checks.

**Acceptance:** installation, checking, and static build run from `repo/`; the draft is not published; the shell is usable at desktop/mobile widths; a new agent can identify the next task using only this directory. No absolute paths or parent assets are required by the build. No remote or public deployment is created.

**Verification:** `npm ci`, `npm run verify`, dependency audit, real-browser shell/keyboard inspection, source asset integrity, and Git status. Record actual outcomes in `docs/handoff.md`.

**Checkpoint:** review the plan and scaffold; begin Phase 1 in a subsequent requested slice.

## Phase 1 — Page composition and visible starfield

**Depends on:** Phase 0.

**Slices:**

1. Adapt the Stitch first viewport and section flow into semantic Astro components. Establish shared type/spacing/color/motion tokens. Reserve the explorer area without implementing all planet behavior.
2. Add the custom starfield. Compare short recordings at desktop and mobile sizes; make individual twinkles visibly perceptible, with varied timing. Avoid distracting synchronized flashes.
3. Add reduced-motion behavior and a motion control where appropriate. Preserve clear focus indicators, readable text, and page scrolling.

**Acceptance:** the overall portfolio composition resembles the reference intentionally; introductory text and work navigation are immediately legible; the user can clearly see and evaluate the twinkle. Reduced-motion mode presents a stable sky. The scene does not obstruct text or pointer input.

**Verification:** browser review at wide desktop, narrow mobile (including 320 CSS px), keyboard checks, reduced-motion emulation, and `npm run verify`. Record chosen visual values and screenshots; do not claim that a code animation alone passes visual review.

**Checkpoint:** first viewport, layout, and starfield reviewed together before substantial planet polish.

## Phase 2 — One complete planet journey

**Depends on:** Phase 1's reviewed composition.

**Slices:**

1. Install Three.js and its types; implement one representative planet with constrained orbit controls, picking, touch behavior, and a stable HTML selection control.
2. Implement Explore → Visit → Read with camera movement and a readable project view. Keep frame updates separate from navigation state. Reduced motion moves directly to the destination.
3. Add Return and a real static project URL. Prove direct-load/reload, browser Back/Forward, focus restoration, interrupted transitions, and repeated visits before scaling up.
4. Add Land to a verified demo destination, or an explicitly identified local fixture during development. Projects without a demo get a truthful alternative. Preserve ordinary link semantics and modifier-click behavior.

**Acceptance:** one complete journey works with mouse, keyboard, and touch; content remains reachable without JavaScript/WebGL; returning restores a sensible exploration view; reading does not compete with unnecessary orbit motion. URLs work without a server-side SPA fallback.

**Verification:** add focused Playwright tests for selection, direct links, history, return, demo link handling, and reduced motion; manually inspect camera pacing. Test canvas creation/disposal, resize, hidden-tab pause, and WebGL failure. Measure initial load and frame behavior on a representative constrained device/profile.

**Checkpoint:** review the complete journey and measured graphics cost before multiplying planets. Choose final planet fidelity based on this evidence.

## Phase 3 — Interchangeable projects and complete portfolio

**Depends on:** the Phase 2 journey and stable content identifiers.

**Slices:**

1. Drive every planet, label, readable index, and detail page from the content collection. Extend metadata only for demonstrated needs. Demonstrate adding/removing an entry without editing scene code.
2. Check empty, single, and the intended pinned-project count; handle label overlap and long titles. Freeze the initial count range only after checking the real selection.
3. Populate verified project problem/role/approach/results/evidence and repository/demo links. Review public assets and their origins/licenses.
4. Complete experience, about, contact, and supplied resume using the established design. Remove development-only notices and fixtures.

**Acceptance:** content is truthful and easy to edit; the solar system is coherent at the supported count; recruiters can scan the work without operating it; contact and source links are obvious; missing demos have honest alternatives.

**Verification:** schema/build checks, focused navigation tests, link checks, keyboard review, content review, and complete desktop/mobile walkthroughs. No placeholder biography or draft project enters the published result.

**Checkpoint:** review the complete portfolio and content before release hardening.

## Phase 4 — Accessibility, performance, and release readiness

**Depends on:** Phase 3, with real assets/content.

**Slices:**

1. Audit responsive behavior, focus, semantic structure, contrast, motion settings, and scene-independent navigation against WCAG 2.2 AA goals. Check actual touch behavior and mobile reading.
2. Profile image/texture/font sizes, transferred JS, LCP, CLS, and interaction latency. Aim for LCP ≤ 2.5 s, CLS ≤ 0.1, and responsive interactions on a documented mobile profile; lab observations are not field-data guarantees.
3. Adjust loading, device pixel ratio, render frequency, and texture fidelity based on measurement. Ensure background/offscreen rendering is paused when unnecessary and resources are cleaned up.
4. Finish titles/descriptions/social preview assets, favicon, sitemap/canonical URLs once the domain is known, and a usable 404 page. Test Chromium, Firefox, and WebKit, with an actual mobile-device check where available.

**Acceptance:** core content works without graphics; visual motion is controllable; no unresolved critical navigation/accessibility failures; measured costs and any remaining browser limitations are documented. The configured root/subpath build and direct project refresh work.

**Verification:** `npm run verify`, established Playwright suite, accessibility inspection, network/performance capture, and production-preview walkthrough. Add focused regression tests where faults were found; avoid blanket test expansion without a risk to cover.

**Checkpoint:** review concrete release evidence and any remaining limitations.

## Phase 5 — GitHub Pages launch

**Depends on:** Phase 4 and a confirmed GitHub destination/visibility/publication decision.

**Slices:**

1. Configure the chosen repository, public site origin, base path, and optional custom domain. Follow `docs/deployment.md`.
2. Add a Pages workflow with checks before deployment, appropriate minimal permissions, and a deployment environment. Configure required checks for the publication branch when repository permissions allow it.
3. Publish the reviewed release, then test the actual public origin, HTTPS, internal links, project reload/history behavior, resume, and demo destinations.
4. Record the live URL, deployment commands/settings, a known-good release, and rollback instructions in the handoff.

**Acceptance:** the public site matches the reviewed build; no draft content or secrets are present; an ordinary content edit can be checked and deployed predictably. The user knows where to edit content and how to roll back.

## Scope and risk controls

| Risk                                            | Response                                                                            |
| ----------------------------------------------- | ----------------------------------------------------------------------------------- |
| Scene obscures the person's work                | Keep identity, readable project navigation, and contact independently visible.      |
| Twinkle remains imperceptible                   | Review a real recording before accepting Phase 1.                                   |
| Impressive camera movement breaks navigation    | Prove history, direct links, interruptions, and return in the single-project slice. |
| Visual fidelity exceeds mobile budget           | Measure early in Phase 2; use adaptive rendering and a readable fallback.           |
| Project changes require source edits            | Collection-driven labels, routes, and scene inputs in Phase 3.                      |
| Agents lose context or maintain competing plans | One versioned handoff/checklist inside `repo`, with outer pointers only.            |
| Framework/tool accumulation                     | Install dependencies only when a slice uses them and document meaningful changes.   |

`tasks/todo.md` is the executable checklist. `docs/handoff.md` records actual status and evidence; future phases are not described as completed work.
