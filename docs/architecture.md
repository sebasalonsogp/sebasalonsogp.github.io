# Architecture and decisions

Status: updated for the approved concept (plan v2). Decisions were delegated by the user;
this file records what was chosen and why.

## Stack

| Choice                                  | Reason                                                                               | Enters in |
| --------------------------------------- | ------------------------------------------------------------------------------------ | --------- |
| Astro static output                     | Mostly readable content with bounded interactive areas; static HTML for every route. | Phase 0   |
| Strict TypeScript                       | Explicit content and interaction contracts.                                          | Phase 0   |
| Scoped CSS + tokens                     | Bespoke design; no template system.                                                  | Phase 0   |
| Astro content collections + Zod         | Validated, replaceable content; types derived from schemas.                          | Phase 1   |
| Fontsource (self-hosted fonts)          | No third-party font requests; subsetting; stable rendering.                          | Phase 1   |
| Playwright + @axe-core/playwright       | Real-browser journeys and accessibility checks in CI.                                | Phase 1   |
| GitHub Pages + Actions                  | Static hosting, checks gate deploys.                                                 | Phase 1   |
| 2D canvas sky                           | Cheap, independent of WebGL; the effect was proven in the concept.                   | Phase 2   |
| Three.js (direct, no React Three Fiber) | Scene, camera, shaders and picking for the explorer.                                 | Phase 3   |
| Raw WebGL fragment shader               | Black-hole ray tracing is a single full-screen shader; no scene graph needed.        | Phase 7   |

Still excluded unless a documented need appears: React, Tailwind, UI kits, state or
animation libraries, servers, databases.

## Page and route model

```text
content collections + github.json + site.ts
        ↓ build time
/                 Portfolio page (hero, projects, experience, skills, contact)
/projects/<id>/   Same page, rendered with that project's visit panel open (no-JS readable)
/404.html         Black hole page
```

- Both routes use one `PortfolioPage` component with an optional `initialProject`.
- The explorer reads `data-initial-project`; a direct load opens that visit without the fly-in.
- Visiting pushes `/projects/<id>/`; returning pushes `/`; `popstate` drives the scene. No
  SPA fallback is needed because every URL is a real file on Pages.
- As built (4.3): hops between planets replace the history entry; leaving a visit that was
  opened from the home entry steps back (`history.back()`) instead of pushing `/`, so the
  history stays clean. Titles and the list's `aria-current` row follow the visit. A direct
  load renders the static visit first (readable, no JavaScript needed), then the explorer
  takes over at `load` (or after 2.5 s if a slow image or video holds `load` back) and opens
  that visit without flying or moving focus. Project pages keep the project title as the
  only `h1`; their intro pitch is a paragraph shown after returning to the system.
- Per-project titles, descriptions and Open Graph images come from the project entry.

## Client modules (progressive enhancement)

```text
src/features/
  motion/       reduced motion, visibility, fps cap (shared; in use)
  sky/          2D canvas starfield (in use)
  explorer/     Three.js scene, bodies, labels, camera, visit state machine, landing
                previews and lightbox, tour (in use)
  timeline/     build-time layout, selection and playback over the SVG (in use)
  constellation/ build-time layout (in use); selection + filter over the SVG (6.2)
  blackhole/    WebGL shader
```

- Each feature is a plain `<script>` that dynamically imports its module when needed
  (explorer after first paint; black hole when Contact nears the viewport).
- Semantic HTML owns text, links and focus; canvases are `aria-hidden`.
- Scene state machine: `explore → flying → visit → returning`; camera interpolation lives in
  the render loop, UI updates happen on state changes only.
- Timeline and constellation layouts are computed at build time and emitted as SVG; the
  browser only handles interaction.
- Every loop pauses off-screen and in hidden tabs; resources and listeners are disposed on
  teardown.

## Explorer loading (Phase 3.1)

The hero's inline entry (~1.3 KB gzip) checks WebGL2 (required by Three.js r186) and only
then imports `src/features/explorer/explorer.ts` after `load`, at idle time. Without
WebGL2 the chunk is never fetched and the hero reports `data-explorer="unavailable"`. The
render loop reuses `ambientLoop` (60 fps, pauses when the hero is off screen or the tab is
hidden, one still frame under reduced motion); context loss stops it and Three.js restores
resources on `webglcontextrestored`. Measured: initial JS ~4 KB gzip; explorer chunk
136 KB gzip with the bodies (three 0.186.1).

## Budgets

LCP ≤ 2.5 s and CLS ≤ 0.1 on throttled mobile; initial JS ≤ 60 KB gzip; explorer chunk ≤
200 KB gzip; media per visit ≤ 2 MB; explorer 60 fps desktop / ≥ 30 fps phone; black hole
≥ 30 fps or adaptive degradation.

## Secrets and data

No server, auth, or secrets in client code. The GitHub snapshot is fetched by a script
(optionally with `GITHUB_TOKEN` in CI) and committed; the site never calls GitHub at runtime.

## When to revisit

- React/R3F only if the explorer becomes an app with many coordinated controls.
- A motion library only if sequencing becomes hard to reason about in the render loop.
- Other hosting only if the portfolio itself needs server behavior.
