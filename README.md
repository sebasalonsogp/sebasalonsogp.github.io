# Personal Portfolio

A custom outer-space portfolio for backend engineering, AI/ML, and data science. The planned centerpiece is a rotatable solar system with an **Explore → Visit → Read → Land → Return** journey, supported by a readable portfolio page and direct project links.

**Stage:** Phase 0 complete; Phase 1 is next. The current page is a deliberately minimal development shell, not the finished layout. No starfield, 3D explorer, verified biography, or live deployment is implemented yet. See the handoff for actual validation results.

## Start here

- [Product brief](PRODUCT.md): confirmed goals and unresolved choices.
- [Implementation plan](tasks/plan.md) and [task checklist](tasks/todo.md): ordered phases and acceptance criteria.
- [Current handoff](docs/handoff.md): completed work, validation, and the next task.
- [Architecture and stack decisions](docs/architecture.md): boundaries and reasons.
- [Stitch reference](references/README.md): visual source and prior feedback.

## Local development

Use **Node 24.22.0 LTS** (recorded in `.nvmrc`) and npm. The package engines also permit compatible Node 22 and 26 installations. CI uses the pinned LTS version. No global Astro installation, database, account, or environment file is needed.

```sh
npm ci
npm run dev
```

Open the localhost URL printed by Astro. Run all commands in this `repo` directory.

```sh
npm run check         # Astro diagnostics and TypeScript checking
npm run format:check  # Authored source and documentation formatting
npm run build         # Static production output in dist/
npm run preview       # Serve the existing production build locally
npm run verify        # Formatting + checking + build
npm run format        # Apply formatting
```

The repository pins direct package versions and commits `package-lock.json`. Use `npm ci` for reproducible installs. Dependencies are added when the relevant phase needs them: Three.js in the explorer slice, Playwright tests when meaningful interaction behavior exists. No empty framework layers or placeholder test suite are included.

## Structure

```text
src/
  content/projects/   Markdown entries; drafts are hidden
  content.config.ts   Validated project metadata
  layouts/            Shared HTML document structure
  pages/              Astro routes
  styles/             Shared tokens and base CSS
public/               Static files with preserved URLs (currently a favicon)
references/           Original design essentials; not served to visitors
docs/                 Architecture, content, hosting, and handoff
tasks/                Maintained phased plan and checklist
.github/workflows/    CI checks; no deployment workflow yet
```

See [content authoring](docs/content.md) before adding a project. A draft example records the data shape without inventing portfolio claims.

## Agent handoff

Point a new coding agent at this directory and ask it to read `AGENTS.md` and `docs/handoff.md`. Thin Claude and Copilot instruction files point to the same maintained context. No prior conversation, agent memory, proprietary plugin, or absolute machine path is required to continue.

## Hosting

GitHub Pages is the selected target. The repository has no remote or publication configured. [Deployment notes](docs/deployment.md) describe the remaining destination and base-path decisions. Compute-heavy demos will be hosted independently and linked from the portfolio.
