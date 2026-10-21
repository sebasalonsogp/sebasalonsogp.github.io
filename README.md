# Personal Portfolio

A custom outer-space portfolio for backend engineering, ML systems, and data science. The hero is a rotatable solar system where each planet is a project (**Explore → Visit → Land → Return**), followed by a readable project list, a four-lane experience timeline, a skills constellation, and contact set against a live ray-traced black hole.

**Stage:** design approved; Phase 1 (content model, readable site, GitHub Pages pipeline) is next. The current page is still the Phase 0 development shell. See the handoff for actual status.

## Start here

- [Product brief](PRODUCT.md): goals, capabilities and open decisions.
- [Design spec](docs/design-spec.md) and the [approved concept](references/concept/orbit-concept-v19.html) (open in a browser): the visual contract.
- [Implementation plan](tasks/plan.md) and [task checklist](tasks/todo.md): phases, slices and acceptance criteria.
- [Current handoff](docs/handoff.md): completed work, validation, and the next task.
- [Architecture](docs/architecture.md), [content model](docs/content.md), [deployment](docs/deployment.md).

## Local development

Use **Node 24.22.0 LTS** (recorded in `.nvmrc`) and npm. CI uses the pinned LTS version.

```sh
npm ci
npm run dev
```

```sh
npm run check         # Astro diagnostics and TypeScript checking
npm run format:check  # Formatting
npm run build         # Static production output in dist/
npm run preview       # Serve the production build locally
npm run verify        # Formatting + checking + build
npm run format        # Apply formatting
npm test              # Build, serve and run Playwright + axe in Chromium, Firefox, WebKit
```

First run only: `npx playwright install chromium firefox webkit`. Astro allows one `astro preview` at a time, so stop any other preview server before `npm test` (or `npx astro preview stop`).

Dependencies are added by the phase that uses them (fonts and Playwright in Phase 1, Three.js in Phase 3).

## Structure

```text
src/
  content/            Projects, experience, education (validated collections)
  data/               Site profile, skill groups, GitHub snapshot
  features/           Progressive-enhancement modules (sky, explorer, timeline, …)
  layouts/ pages/     Astro layout and routes (/, /projects/<id>/, 404)
  styles/             Tokens and base CSS
public/               Resume, video, favicon
references/           Approved concept and original Stitch export; not served
docs/ tasks/          Spec, architecture, content, deployment, handoff, plan
.github/workflows/    CI checks and (from Phase 1) GitHub Pages deploy
```

## Agent handoff

Point a coding agent at this directory and ask it to read `AGENTS.md` and `docs/handoff.md`. No prior conversation or machine-specific path is required.

## Hosting

GitHub Pages via GitHub Actions, deployed from Phase 1 with `noindex` until launch. See [deployment](docs/deployment.md).
