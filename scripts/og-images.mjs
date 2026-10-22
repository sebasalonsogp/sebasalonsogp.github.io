// Sharing images (Open Graph, 1200 × 630): screenshots of the built site, so the card shows
// what the link opens. `og/home.jpg` is the hero; `og/<id>.jpg` is that project's visit.
// Run `npm run og` (it builds first) after changing content or the hero, then rebuild; the
// images are committed, and a test fails when a project has none.

import { spawn } from 'node:child_process';
import { mkdirSync, readdirSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import { chromium } from 'playwright';

const PORT = 4324;
const base = `http://127.0.0.1:${PORT}`;
const projects = readdirSync('dist/projects');

const server = spawn(
  process.execPath,
  ['node_modules/astro/bin/astro.mjs', 'preview', '--port', String(PORT), '--host', '127.0.0.1'],
  { stdio: 'ignore' },
);
for (let i = 0; i < 60; i++) {
  try {
    if ((await fetch(base)).ok) break;
  } catch {
    // Not up yet.
  }
  await sleep(500);
}

mkdirSync('public/og', { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  /** Waits until the explorer has drawn (or is unavailable) and, on a visit, the panel is in. */
  const settle = () =>
    page.waitForFunction(
      () => {
        const hero = document.querySelector('#hero');
        if (!hero || !['static', 'running', 'unavailable'].includes(hero.dataset.explorer)) {
          return false;
        }
        const panel = document.querySelector('.explorer-visit.is-open');
        return (
          !hero.classList.contains('is-visiting') ||
          (panel && getComputedStyle(panel).opacity === '1')
        );
      },
      null,
      { timeout: 30_000 },
    );
  const shoot = async (path, file) => {
    await page.goto(`${base}${path}`);
    await page.evaluate(() => document.fonts.ready);
    await settle();
    await page.waitForTimeout(600);
    await page.screenshot({ path: `public/og/${file}`, type: 'jpeg', quality: 85 });
    console.log(`public/og/${file}`);
  };
  await shoot('/', 'home.jpg');
  for (const id of projects) await shoot(`/projects/${id}/`, `${id}.jpg`);
} finally {
  await browser.close();
  server.kill();
}
