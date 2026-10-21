# Hosting and deployment

Target: **GitHub Pages**, deployed by GitHub Actions from `main`.

## Decisions

- **Repository:** `sebasalonsogp/sebasalonsogp.github.io` (recommended). Serves at
  `https://sebasalonsogp.github.io/` with `base: '/'`. A custom domain can be added later
  without changing paths.
  - If a project repository is used instead (e.g. `portfolio`), set `base: '/portfolio'`
    and keep every internal URL on `import.meta.env.BASE_URL`.
- **Visibility before launch:** deploy from Phase 1 with `<meta name="robots"
content="noindex">` and no sitemap submission. Removed in Phase 9.

## Astro configuration

```js
export default defineConfig({
  site: 'https://sebasalonsogp.github.io',
  base: '/',
  output: 'static',
  trailingSlash: 'always',
});
```

Pages serves `/projects/<id>/index.html` for `/projects/<id>/` and `404.html` for unknown
paths. No SPA rewrites are needed.

## Workflows

- `.github/workflows/ci.yml` — format, Astro + TypeScript checks, build, `npm audit`, and
  Playwright + axe in Chromium, Firefox and WebKit. Runs on pull requests and manual
  dispatch, and is reusable (`workflow_call`).
- `.github/workflows/deploy.yml` — on push to `main` (and manual dispatch):
  1. **check** calls `ci.yml`; nothing deploys unless it passes.
  2. **build** runs `npm run build` and uploads `dist/` with
     `actions/upload-pages-artifact` (v5.0.0).
  3. **deploy** publishes with `actions/deploy-pages` (v5.0.1) into the `github-pages`
     environment. Only this job gets `pages: write` and `id-token: write`.
- Actions are pinned to commit SHAs. In repository settings, set Pages source to "GitHub
  Actions"; optionally require the CI check on pull requests to `main`.
- A build with `--base /portfolio/` was checked: every root-relative URL picks up the base,
  so a project repository would only need the `base` line changed.

## After each deploy

Open the live URL: home, one `/projects/<id>/` direct load and refresh, an unknown path
(404), resume download, and one demo link.

## Launch (Phase 9)

Remove `noindex`, add sitemap and canonical URLs, optional custom domain (`CNAME` in
`public/`, DNS records, enforce HTTPS), tag `v1.0.0`.

## Rollback

Revert the offending commit on `main` (or re-run the deploy workflow on the last good
commit). Never edit the deployed output by hand.
