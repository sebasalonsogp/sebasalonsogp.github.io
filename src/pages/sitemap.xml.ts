// Sitemap of every page (the home page and one per project), with last-modified dates from
// the GitHub snapshot. Pages stay `noindex` until launch (`indexable` in src/data/site.ts).
import type { APIRoute } from 'astro';
import { getProjects } from '../lib/content';
import { withBase } from '../lib/format';

export const GET: APIRoute = async ({ site }) => {
  const projects = await getProjects();
  const url = (path: string) => new URL(withBase(path), site).href;
  const latest = projects
    .map((p) => p.github.lastCommit)
    .sort()
    .at(-1);
  const pages = [
    { loc: url(''), lastmod: latest },
    ...projects.map((p) => ({ loc: url(`projects/${p.id}/`), lastmod: p.github.lastCommit })),
  ];
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...pages.map(
      ({ loc, lastmod }) =>
        `  <url><loc>${loc}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`,
    ),
    '</urlset>',
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
