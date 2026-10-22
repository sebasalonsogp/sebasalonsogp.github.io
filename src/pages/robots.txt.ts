// Crawlers may fetch everything (before launch they need to, to see each page's `noindex`)
// and are pointed at the sitemap.
import type { APIRoute } from 'astro';
import { withBase } from '../lib/format';

export const GET: APIRoute = ({ site }) =>
  new Response(
    `User-agent: *\nAllow: /\n\nSitemap: ${new URL(withBase('sitemap.xml'), site).href}\n`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
