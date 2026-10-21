import { expect, test, type Page } from '@playwright/test';

interface SkySnapshot {
  /** Non-transparent pixels in the star layer. */
  lit: number;
  /** Fingerprint of both layers. */
  hash: number;
  /** Star-layer pixels that differ from the previous snapshot on this page. */
  changed: number;
}

/** Reads the sky in the page and compares it with the previous read there, so only a few
 * numbers cross the protocol (whole canvases are slow to transfer, especially in WebKit). */
function snapshot(page: Page): Promise<SkySnapshot> {
  return page.evaluate(() => {
    const read = (selector: string) => {
      const canvas = document.querySelector<HTMLCanvasElement>(selector)!;
      return canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data;
    };
    const stars = read('[data-sky-stars]');
    const still = read('[data-sky-static]');
    const store = window as unknown as { skyPrevious?: Uint8ClampedArray };
    const previous = store.skyPrevious;
    let lit = 0;
    let changed = 0;
    let hash = 0;
    for (let i = 3; i < stars.length; i += 4) {
      if (stars[i]! > 0) lit++;
      if (previous && previous[i] !== stars[i]) changed++;
    }
    for (const data of [stars, still]) {
      for (let i = 0; i < data.length; i += 97) hash = (hash * 31 + data[i]!) | 0;
    }
    store.skyPrevious = stars;
    return { lit, hash, changed };
  });
}

const layerOffsetY = (page: Page) =>
  page.evaluate(
    () => new DOMMatrix(getComputedStyle(document.querySelector('[data-sky-layer]')!).transform).f,
  );

test.describe('sky', () => {
  test('is painted, decorative and does not block the page', async ({ page }) => {
    await page.goto('/');
    const sky = page.locator('[data-sky]');
    await expect(sky).toHaveAttribute('aria-hidden', 'true');
    await expect(sky).toHaveCSS('pointer-events', 'none');
    await expect(sky).toHaveAttribute('data-motion', 'animated');
    expect((await snapshot(page)).lit).toBeGreaterThan(1000);
    // Content above the sky stays clickable.
    await page.getByRole('link', { name: 'See the list instead' }).click();
    await expect(page).toHaveURL(/#projects$/);
  });

  test('bright stars twinkle when motion is allowed', async ({ page }) => {
    await page.goto('/');
    await snapshot(page);
    await page.waitForTimeout(500);
    expect((await snapshot(page)).changed).toBeGreaterThan(500);
  });

  test('scrolling moves the sky (parallax)', async ({ page }) => {
    await page.goto('/');
    expect(await layerOffsetY(page)).toBe(0);
    await page.evaluate(() => window.scrollTo(0, 1000));
    await expect.poll(() => layerOffsetY(page)).toBeCloseTo(-30, 0);
  });

  test('pauses while the tab is hidden and resumes when shown', async ({ page }) => {
    await page.goto('/');
    const setHidden = (hidden: boolean) =>
      page.evaluate((value) => {
        Object.defineProperty(document, 'hidden', { configurable: true, get: () => value });
        document.dispatchEvent(new Event('visibilitychange'));
      }, hidden);

    await setHidden(true);
    await page.waitForTimeout(100);
    await snapshot(page);
    await page.waitForTimeout(500);
    expect((await snapshot(page)).changed).toBe(0);

    await setHidden(false);
    await page.waitForTimeout(500);
    expect((await snapshot(page)).changed).toBeGreaterThan(500);
  });
});

test.describe('sky with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('is a single still frame with no parallax', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-sky]')).toHaveAttribute('data-motion', 'static');
    const first = await snapshot(page);
    expect(first.lit).toBeGreaterThan(1000);
    await page.evaluate(() => window.scrollTo(0, 1000));
    await page.waitForTimeout(600);
    expect((await snapshot(page)).changed).toBe(0);
    expect(await layerOffsetY(page)).toBe(0);
  });

  test('is the same sky on every load (seeded)', async ({ page }) => {
    await page.goto('/');
    const first = await snapshot(page);
    await page.reload();
    expect((await snapshot(page)).hash).toBe(first.hash);
  });
});
