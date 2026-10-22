# Hosting and deployment

Target: **GitHub Pages**, deployed by GitHub Actions from `main`.

## Decisions

- **Repository:** `sebasalonsogp/sebasalonsogp.github.io` (recommended). Serves at
  `https://sebasalonsogp.github.io/` with `base: '/'`. A custom domain can be added later
  without changing paths.
  - If a project repository is used instead (e.g. `portfolio`), set `base: '/portfolio'`
    and keep every internal URL on `import.meta.env.BASE_URL`.
- **Visibility before launch:** every page carries `<meta name="robots" content="noindex">`
  while `indexable` in `src/data/site.ts` is `false`; no sitemap submission. Flipped at
  launch (below). The 404 is never indexed.

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

- `.github/workflows/ci.yml` — in the Playwright container: format, Astro + TypeScript
  checks, build, size budgets, `npm audit`, Playwright + axe in Chromium, Firefox and WebKit,
  and the Lighthouse budgets (results in the job summary). Runs on pull requests and manual
  dispatch, and is reusable (`workflow_call`).
- `.github/workflows/github-data.yml` — Mondays and on demand: refreshes
  `src/data/github.json` and opens a pull request when it changed (docs/content.md).
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

The deploy job's summary has the Lighthouse table. Then, on the live URL:

- [ ] Home loads; the sky twinkles and the solar system turns; no console errors.
- [ ] A project URL loads directly, survives a refresh, and Back returns to the system.
- [ ] An unknown path shows the 404 (status 404).
- [ ] The resume downloads; one live-demo link and one source link open.
- [ ] Timeline: play it; constellation: select a star; contact: copy email.
- [ ] `/robots.txt` and `/sitemap.xml` respond; a page's sharing card shows in LinkedIn's Post
      Inspector.
- [ ] `<meta name="robots">`: `noindex` before launch; absent after (404 always `noindex`).

## Launch (Phase 9)

1. **Content** (9.1): apply the decisions in `docs/release-candidate.md`; if the hero or
   projects changed, `npm run og` and rebuild.
2. **Indexing** (9.2): set `indexable = true` in `src/data/site.ts`. That removes `noindex`
   from every page except the 404, and the SEO tests follow the switch. Merge to `main`;
   the deploy runs every check first.
3. **Custom domain** (optional): add `public/CNAME` with the domain; set `site` in
   `astro.config.mjs` to it (canonical, sharing and sitemap URLs follow); at the DNS
   provider, an apex domain needs GitHub Pages' `A`/`AAAA` records and `www` a `CNAME` to
   `sebasalonsogp.github.io`; in Settings → Pages set the custom domain, wait for the
   certificate and keep "Enforce HTTPS" on (it is on today). Verify the domain for the
   account in GitHub settings to prevent takeovers.
4. **Verify** with the checklist above, plus: the page source has no `noindex`; Google
   Search Console and Bing Webmaster Tools (owner verification by meta tag or DNS) accept
   the sitemap URL.
5. **Tag** the deployed commit: `git tag -a v1.0.0 -m "Launch" <sha>` and
   `git push origin v1.0.0`.

## Rollback

Only `main` may deploy to the `github-pages` environment, so rollback is a commit:

- **A bad change:** `git revert <sha>` on a branch, merge it to `main`; the deploy
  republishes once CI passes. Never force-push `main` or edit the deployed output by hand.
- **Urgent, CI too slow:** the same revert, then wait for the deploy (about 15 minutes).
  Settings → Pages can unpublish the site entirely if something must disappear at once.
- **Undo the launch:** set `indexable = false` and deploy; ask search consoles to drop
  URLs if needed.
- **Undo a custom domain:** remove `public/CNAME`, restore `site`, clear the domain in
  Settings → Pages.
