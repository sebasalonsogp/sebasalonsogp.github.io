# Architecture and decisions

Status: selected by the assistant under the user's explicit delegation. This document distinguishes the installed foundation from planned graphics behavior.

## Stack

| Choice                               | Reason                                                                                                                            | Installed now?                     |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| Astro static output                  | Builds semantic HTML routes from components and content; a portfolio is mostly readable material with a bounded interactive area. | Yes                                |
| Strict TypeScript                    | Makes content and interaction contracts explicit and catches accidental state/type errors.                                        | Yes                                |
| Scoped CSS + shared CSS variables    | Fits a small set of bespoke sections and retains direct control of the supplied design.                                           | Yes                                |
| Markdown + Astro content collections | Validates replaceable project metadata and derives types from the schema.                                                         | Yes                                |
| Direct Three.js + OrbitControls      | Provides scene rendering, camera control, picking, and animation for the project's main visual requirement.                       | Phase 2                            |
| Playwright                           | Verifies the actual multi-step visitor journey and navigation once it exists.                                                     | Phase 2                            |
| Node 24 LTS + npm                    | Reproducible local/CI builds with an ordinary lockfile workflow.                                                                  | Configured                         |
| GitHub Pages + Actions               | Hosts static output without an application server. CI can check the same build commands used locally.                             | CI file only; publication deferred |

Astro is the site framework, not a different spelling of React. Its `.astro` components generate HTML during the static build. Browser TypeScript is added explicitly to the features that need interaction. We can add a React island later, but no current requirement needs that runtime or React Three Fiber.

Custom CSS is a maintenance choice, not a guarantee of original design. The supplied composition, typography, deliberate motion, and authored interactions determine originality. Do not import a template component library to fill out the page.

## Existing foundation

- `src/layouts/BaseLayout.astro` owns the document head, global styles, skip link, and main landmark.
- `src/pages/index.astro` queries non-draft project data and renders a minimal shell. It deliberately does not establish the final portfolio layout.
- `src/styles/global.css` starts shared colors and accessible base rules. Expand tokens during Phase 1 rather than adding a generic design-system package.
- `src/content.config.ts` defines a small project schema; one draft entry demonstrates authoring. No project is currently published.
- `astro.config.mjs` uses static output and trailing-slash URLs. Deployment-specific origin/base settings are not invented.

## Planned boundaries (create only when needed)

```text
Markdown project entries
        ↓ build-time validation
Astro index + static /projects/<id>/ detail routes
        ↓ small serializable scene inputs
HTML explorer controls ↔ TypeScript navigation controller ↔ Three.js scene
        ↓                                          ↓
project descriptions, focus, links          pixels, camera, picking
```

The scene must not be the only source of text, navigation, or selected-project state. Markdown produces actual static detail pages. Phase 2 will choose and prove how enhanced Visit navigation shares those URLs without requiring GitHub Pages to rewrite arbitrary SPA routes.

Use a small explicit state model for exploring, visiting, reading, and returning. Camera interpolation and per-frame updates stay inside graphics code; HTML updates occur on navigation/state changes. Use Three.js's controls and render loop. Add a tweening/state library only if the implemented sequence demonstrates a real need.

Suggested modules at that point are `src/components/explorer/` for the HTML wrapper and `src/features/explorer/` for scene/controller code. These are boundaries, not a request to create empty layers today. Split modules when they have distinct responsibilities, not to satisfy a folder diagram.

## Performance and resilience

Keep the initial document useful before graphics load. Load the explorer only where needed. Honor reduced motion, handle resize and WebGL failure, cap rendering resolution based on measured device cost, pause unnecessary rendering, and dispose listeners, controls, geometries, materials, textures, and renderers appropriately.

A separate simple starfield may use CSS or Canvas if the Phase 1 prototype validates the look and cost. The technology choice should follow the visible effect and measurements; do not force all background pixels through the heavier explorer pipeline.

Measure real assets and the first complete visit in Phase 2. Preserve a readable fallback and normal page scroll on mobile. A successful desktop animation is not evidence of mobile usability.

## Content, hosting, and secrets

Keep project facts in the content collection. Stable file identifiers become URL identifiers; scene ordering is presentation metadata. Future visual treatment metadata should describe a project rather than encode raw arbitrary scene code.

The portfolio has no server, database, authentication, or model inference. Land links to independently hosted demos. Do not embed API credentials or private environment values in source or client scripts. A contact email/professional link is sufficient unless a concrete need justifies a form backend.

## When to revisit a decision

- Consider React/R3F if the explorer becomes an application with many coordinated controls and component lifecycles that materially benefit from that model.
- Consider a motion library if sequencing becomes difficult to reason about with the renderer loop and native CSS/Web Animations.
- Consider different hosting if the portfolio itself needs server behavior. Separately hosted demos alone do not justify it.
- Record the requirement, alternatives, cost, and chosen change here before introducing a major dependency.

## Version and source notes

Package metadata was checked during scaffolding. TypeScript 6.0.3 satisfies `@astrojs/check` 0.9.11's supported peer range; TypeScript 7 is intentionally not selected. The lockfile records transitive versions. Node 24.22.0 is the selected LTS build runtime.

- [Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Astro browser scripts](https://docs.astro.build/en/guides/client-side-scripts/)
- [Content collections](https://docs.astro.build/en/guides/content-collections/)
- [Node release support](https://nodejs.org/en/about/previous-releases)
- [Three.js OrbitControls](https://threejs.org/docs/pages/OrbitControls.html)
- [Astro on GitHub Pages](https://docs.astro.build/en/guides/deploy/github/)

Check the installed package versions before using examples from newer documentation.
