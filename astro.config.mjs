import { defineConfig } from 'astro/config';

// GitHub Pages user site (docs/deployment.md). A project repository would instead need
// base: '/<repository>'; every internal URL already goes through import.meta.env.BASE_URL.
export default defineConfig({
  site: 'https://sebasalonsogp.github.io',
  base: '/',
  output: 'static',
  trailingSlash: 'always',
  // The CSS is small (about 7 KB gzip); inlining it removes two render-blocking requests,
  // which cost ~600 ms of LCP on Lighthouse's slow-4G profile (docs/handoff.md, 8.2).
  build: { inlineStylesheets: 'always' },
});
