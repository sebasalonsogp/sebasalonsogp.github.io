import { expect, test, type Page } from '@playwright/test';

const EXPLORER_CHUNK = /\/_astro\/explorer\.[^/]+\.js$/;

const supportsWebGL2 = (page: Page) =>
  page.evaluate(() => Boolean(document.createElement('canvas').getContext('webgl2')));

const hero = (page: Page) => page.locator('#hero');

test.describe('explorer shell', () => {
  test('loads after the page and fills the hero', async ({ page }) => {
    await page.goto('/');
    if (!(await supportsWebGL2(page))) {
      await expect(hero(page)).toHaveAttribute('data-explorer', 'unavailable');
      return;
    }
    await expect(hero(page)).toHaveAttribute('data-explorer', 'running', { timeout: 10_000 });

    const canvas = page.locator('#hero canvas.system');
    await expect(canvas).toHaveAttribute('aria-hidden', 'true');
    await expect(canvas).toHaveCSS('pointer-events', 'none');
    // The canvas covers the hero's padding box and its drawing buffer matches it at the
    // capped device pixel ratio.
    const size = await page.evaluate(() => {
      const el = document.querySelector<HTMLCanvasElement>('#hero canvas.system')!;
      const heroEl = document.querySelector<HTMLElement>('#hero')!;
      return {
        css: [el.clientWidth, el.clientHeight],
        hero: [heroEl.clientWidth, heroEl.clientHeight],
        buffer: [el.width, el.height],
        dpr: Math.min(2, devicePixelRatio),
      };
    });
    expect(size.css).toEqual(size.hero);
    expect(size.buffer).toEqual(size.css.map((v) => Math.floor(v * size.dpr)));

    // Three.js is fetched only after the load event, so it cannot delay the first paint.
    const timing = await page.evaluate((source) => {
      const pattern = new RegExp(source);
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const chunk = performance.getEntriesByType('resource').find((r) => pattern.test(r.name));
      return { load: nav.loadEventStart, chunk: chunk?.startTime ?? -1 };
    }, EXPLORER_CHUNK.source);
    expect(timing.chunk).toBeGreaterThanOrEqual(timing.load);
  });

  test('hero text is the largest contentful paint', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'WebKit does not expose largest-contentful-paint');
    await page.goto('/');
    await expect(hero(page)).not.toHaveAttribute('data-explorer', 'loading', { timeout: 10_000 });
    const element = await page.evaluate(
      () =>
        new Promise<string>((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries() as (PerformanceEntry & { element?: Element })[];
            const last = entries.at(-1)?.element;
            resolve(last ? `${last.tagName.toLowerCase()}.${last.className}` : 'none');
          }).observe({ type: 'largest-contentful-paint', buffered: true });
        }),
    );
    expect(element).toMatch(/^(h1|p)\b/);
  });

  test('pauses while the hero is off screen and resumes', async ({ page }) => {
    await page.goto('/');
    test.skip(!(await supportsWebGL2(page)), 'No WebGL2 in this browser');
    await expect(hero(page)).toHaveAttribute('data-explorer', 'running', { timeout: 10_000 });
    await page.locator('#contact').scrollIntoViewIfNeeded();
    await expect(hero(page)).toHaveAttribute('data-explorer', 'paused');
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(hero(page)).toHaveAttribute('data-explorer', 'running');
  });

  test('follows the hero size', async ({ page }) => {
    await page.goto('/');
    test.skip(!(await supportsWebGL2(page)), 'No WebGL2 in this browser');
    await expect(hero(page)).toHaveAttribute('data-explorer', 'running', { timeout: 10_000 });
    await page.setViewportSize({ width: 390, height: 844 });
    await expect
      .poll(() =>
        page.evaluate(() => {
          const el = document.querySelector<HTMLCanvasElement>('#hero canvas.system')!;
          return el.width / Math.min(2, devicePixelRatio);
        }),
      )
      .toBe(390);
  });
});

test.describe('explorer with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('renders a still frame instead of a running loop', async ({ page }) => {
    await page.goto('/');
    test.skip(!(await supportsWebGL2(page)), 'No WebGL2 in this browser');
    await expect(hero(page)).toHaveAttribute('data-explorer', 'static', { timeout: 10_000 });
  });
});

test.describe('explorer without WebGL2', () => {
  test.beforeEach(async ({ page }) => {
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
  });

  test('never downloads Three.js and keeps the readable hero and list', async ({ page }) => {
    const chunkRequests: string[] = [];
    page.on('request', (request) => {
      if (EXPLORER_CHUNK.test(request.url())) chunkRequests.push(request.url());
    });
    await page.goto('/');
    await expect(hero(page)).toHaveAttribute('data-explorer', 'unavailable');
    await page.waitForTimeout(2500);
    expect(chunkRequests).toEqual([]);
    await expect(page.locator('#hero canvas.system')).toHaveCount(0);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('#projects .row a')).not.toHaveCount(0);
  });
});
