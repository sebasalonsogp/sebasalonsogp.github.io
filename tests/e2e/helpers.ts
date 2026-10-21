import type { Page } from '@playwright/test';

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
