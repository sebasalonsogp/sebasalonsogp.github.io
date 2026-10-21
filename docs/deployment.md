# Hosting and deployment

Selected host: **GitHub Pages**, serving Astro's `dist/` output. The scaffold has no GitHub remote, Pages deployment workflow, custom domain, or live site.

## Decisions needed at launch

- The repository owner/name and visibility. GitHub Pages availability for private repositories depends on the account plan; confirm when choosing visibility.
- Whether this is the account root (`OWNER.github.io` repository), a repository subpath, or a custom domain.
- The publication branch and initial publication decision.

## Configuration

Set Astro's `site` to the public origin. Use `/` as `base` for an account-root/custom-domain site; use `/REPOSITORY` for a project site under that path. Document the final values in `astro.config.mjs` when the destination is known.

For a local subpath rehearsal before a destination exists:

```sh
npm run build -- --site https://example.com --base /portfolio-check
npm run preview -- --base /portfolio-check
```

Open the URL Astro prints. The example origin is a build-only placeholder; no request publishes there. Rebuild normally afterward. All internal/asset URLs introduced later must respect `import.meta.env.BASE_URL` or the equivalent Astro URL construction. Test nested project refreshes on the built site; GitHub Pages does not provide arbitrary SPA routing rewrites.

## CI and future publication

`.github/workflows/ci.yml` checks pull requests and pushes to `main`: reproducible install, formatting, Astro/TypeScript diagnostics, production build, and dependency audit. Actions are pinned to reviewed commit identifiers. It does not deploy. Its steps have local equivalents; a hosted run still requires a remote.

Phase 2 will add actual interaction tests and their browser installation step to this workflow. There is no empty test command or false passing test suite in the foundation.

At launch, add a Pages workflow using the maintained official actions, with checks before deployment, read-only permissions for build, and only the permissions needed by the deployment job. Set up the `github-pages` environment and required branch checks where available. Publish `dist/`, not source or the surrounding project container.

After deployment, check HTTPS, origin/base paths, direct project URLs, refresh, social metadata, contact/resume, and demo links on the public site. Record the release commit and live URL. Roll back by redeploying the previous known-good source commit through the same checks; do not improvise manual changes to generated output.

- [Astro's GitHub Pages guide](https://docs.astro.build/en/guides/deploy/github/)
- [GitHub Pages overview](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
