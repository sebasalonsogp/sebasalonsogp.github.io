// Web app manifest: the name and icons used when the site is saved to a home screen.
import type { APIRoute } from 'astro';
import { site } from '../data/site';
import { withBase } from '../lib/format';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify({
      name: site.name,
      short_name: site.name.split(' ')[0],
      start_url: withBase(''),
      display: 'browser',
      background_color: '#030408',
      theme_color: '#030408',
      icons: [
        { src: withBase('icon-192.png'), sizes: '192x192', type: 'image/png' },
        { src: withBase('icon-512.png'), sizes: '512x512', type: 'image/png' },
      ],
    }),
    { headers: { 'Content-Type': 'application/manifest+json' } },
  );
