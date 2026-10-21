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

## Workflow (`.github/workflows/deploy.yml`)

1. Trigger on push to `main` (and manual dispatch).
2. **Check job:** `npm ci`, `npm run verify`, Playwright against `astro preview`.
3. **Build job:** build and upload `dist/` with `actions/upload-pages-artifact`.
4. **Deploy job:** `actions/deploy-pages` into the `github-pages` environment.
   Permissions: `contents: read` for build; `pages: write` and `id-token: write` for deploy only.
5. Pin actions to commit SHAs (existing CI policy). In repository settings, set Pages source
   to "GitHub Actions" and require the check job on `main`.

## After each deploy

Open the live URL: home, one `/projects/<id>/` direct load and refresh, an unknown path
(404), resume download, and one demo link.

## Launch (Phase 9)

Remove `noindex`, add sitemap and canonical URLs, optional custom domain (`CNAME` in
`public/`, DNS records, enforce HTTPS), tag `v1.0.0`.

## Rollback

Revert the offending commit on `main` (or re-run the deploy workflow on the last good
commit). Never edit the deployed output by hand.
