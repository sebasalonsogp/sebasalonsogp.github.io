import { expect, test, type Page } from '@playwright/test';

/** Project page paths, read from the home page's project list (no hard-coded ids). */
export async function projectPaths(page: Page): Promise<string[]> {
  await page.goto('/');
  return page
    .locator('#projects .row a')
    .evaluateAll((links) => links.map((a) => a.getAttribute('href') ?? ''));
}

/**
 * Opens a page once its HTML is parsed. Everything under test is server-rendered, and
 * Playwright's Windows WebKit never fires `load` on pages with a WebM video (see
 * docs/handoff.md), so tests do not wait for every asset.
 */
export async function open(page: Page, path: string) {
  return page.goto(path, { waitUntil: 'domcontentloaded' });
}

/** True when the document is wider than the viewport. */
export function hasHorizontalScroll(page: Page): Promise<boolean> {
  return page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
}

/**
 * Makes WebGL2 unavailable for the page, so the 3D scene never loads and the static page
 * (the no-WebGL fallback) is what the visitor gets.
 */
export async function withoutWebGL2(page: Page) {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...rest: unknown[]
    ) {
      if (type === 'webgl2') return null;
      return (original as (...args: unknown[]) => unknown).call(this, type, ...rest);
    } as typeof HTMLCanvasElement.prototype.getContext;
  });
}

/**
 * Waits until the page has settled: the explorer has finished loading (or is unavailable) and,
 * during a visit, the panel has finished fading in. Scans of a half-faded panel would measure
 * contrast for text no visitor sees.
 */
export async function settled(page: Page) {
  await page.waitForFunction(
    () => {
      const hero = document.querySelector<HTMLElement>('#hero');
      if (!hero || hero.dataset.explorer === 'loading') return false;
      if (hero.dataset.mode === 'flying' || hero.dataset.mode === 'returning') return false;
      const panel = document.querySelector('.explorer-visit.is-open');
      return !panel || getComputedStyle(panel).opacity === '1';
    },
    null,
    { timeout: 15_000 },
  );
}

export const hero = (page: Page) => page.locator('#hero');
export const visitTitle = (page: Page) => page.locator('#explorer-visit-title');

/** WebGL 1, which the black hole needs (CI's Linux Firefox has none). */
export const supportsWebGL = (page: Page) =>
  page.evaluate(() => Boolean(document.createElement('canvas').getContext('webgl')));

export const supportsWebGL2 = (page: Page) =>
  page.evaluate(() => Boolean(document.createElement('canvas').getContext('webgl2')));

/**
 * Loads the home page at 1440×900 with the explorer ready, skipping the test without WebGL2.
 * Reduced motion (the default here) makes every flight instant.
 */
export async function ready(page: Page, { motion = false } = {}) {
  if (!motion) await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  test.skip(!(await supportsWebGL2(page)), 'No WebGL2 in this browser');
  await expect(hero(page)).toHaveAttribute('data-explorer', motion ? 'running' : 'static', {
    timeout: 10_000,
  });
}

/** Projects in list order, from the page's project rows. */
export const projectList = (page: Page) =>
  page.locator('[data-project-row]').evaluateAll((rows) =>
    rows.map((row) => ({
      id: row.getAttribute('data-project-row')!,
      title: row.querySelector('h3')!.textContent!.trim(),
    })),
  );

/** Media count per project from the embedded data, so tests follow the content. */
export const mediaCounts = (page: Page) =>
  page.evaluate(() =>
    (
      JSON.parse(document.querySelector('script[data-explorer-system]')!.textContent!) as {
        projects: { id: string; media: unknown[] }[];
      }
    ).projects.map((p) => ({ id: p.id, media: p.media.length })),
  );
