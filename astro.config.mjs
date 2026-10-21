import { defineConfig } from 'astro/config';

// GitHub Pages user site (docs/deployment.md). A project repository would instead need
// base: '/<repository>'; every internal URL already goes through import.meta.env.BASE_URL.
export default defineConfig({
  site: 'https://sebasalonsogp.github.io',
  base: '/',
  output: 'static',
  trailingSlash: 'always',
});
