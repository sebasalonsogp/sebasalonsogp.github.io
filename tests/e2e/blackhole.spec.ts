import { expect, test, type Page } from '@playwright/test';
import { hasHorizontalScroll, supportsWebGL } from './helpers';

const figure = (page: Page) => page.locator('[data-black-hole]');

/** Scrolls Contact into view, which loads the black hole. */
async function toContact(page: Page) {
  await page.evaluate(() => document.querySelector('#contact')!.scrollIntoView());
}
/** For tests that need the black hole drawn: skips where the browser has no WebGL. */
async function requireWebGL(page: Page) {
  test.skip(!(await supportsWebGL(page)), 'No WebGL in this browser');
}
const drawn = (page: Page) =>
  page.waitForFunction(
    () => {
      const f = document.querySelector<HTMLElement>('[data-black-hole]');
      return f !== null && !f.hidden && f.dataset.pending === undefined;
    },
    null,
    { timeout: 30_000 },
  );

/**
 * Makes the GPU look like it takes `ms` per frame: the renderer's name is hidden (so it is
 * timed rather than recognised) and the pixel read that times a frame just waits.
 */
const fakeGpu = (page: Page, ms: number) =>
  page.addInitScript((frameMs) => {
    const proto = WebGLRenderingContext.prototype;
    const getExtension = proto.getExtension;
    proto.getExtension = function (this: WebGLRenderingContext, name: string) {
      return name === 'WEBGL_debug_renderer_info'
        ? null
        : (getExtension as (name: string) => unknown).call(this, name);
    } as typeof proto.getExtension;
    const getParameter = proto.getParameter;
    proto.getParameter = function (this: WebGLRenderingContext, name: number) {
      return name === this.RENDERER ? 'Test GPU' : getParameter.call(this, name);
    } as typeof proto.getParameter;
    proto.readPixels = function () {
      const end = performance.now() + frameMs;
      while (performance.now() < end) {
        // Busy-wait: the frame "takes" this long.
      }
    } as typeof proto.readPixels;
  }, ms);

test.describe('black hole', () => {
  // A phone-sized banner keeps the real (often software) rendering cheap in CI.
  test.beforeEach(async ({ page }) => page.setViewportSize({ width: 390, height: 844 }));

  test('loads only when Contact comes near', async ({ page }) => {
    const chunks: string[] = [];
    page.on('request', (r) => {
      if (/blackhole[^/]*\.js/.test(r.url())) chunks.push(r.url());
    });
    await page.goto('/');
    await page.waitForTimeout(1500);
    expect(chunks).toEqual([]);
    await expect(figure(page)).toBeHidden();
    await toContact(page);
    await expect.poll(() => chunks.length).toBeGreaterThan(0);
  });

  test('is decorative and never covers the contact details', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await requireWebGL(page);
    await toContact(page);
    await drawn(page);
    await expect(figure(page)).toHaveAttribute('aria-hidden', 'true');
    for (const link of await page.locator('#contact a, #contact button').all()) {
      if (!(await link.isVisible())) continue;
      const box = (await link.boundingBox())!;
      const hit = await page.evaluate(
        ({ x, y }) => document.elementFromPoint(x, y)?.closest('a, button')?.outerHTML ?? '',
        { x: box.x + box.width / 2, y: box.y + box.height / 2 },
      );
      expect(hit).toBe(await link.evaluate((el) => el.outerHTML));
    }
    expect(await hasHorizontalScroll(page)).toBe(false);
  });

  test('a fast GPU animates it at full resolution, and it pauses off screen', async ({ page }) => {
    await fakeGpu(page, 2);
    await page.goto('/');
    await requireWebGL(page);
    await toContact(page);
    await drawn(page);
    await expect(figure(page)).toHaveAttribute('data-state', 'running');
    await expect(figure(page)).toHaveAttribute('data-quality', '1.00');
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(figure(page)).toHaveAttribute('data-state', 'paused');
  });

  test('a slower GPU gets fewer pixels', async ({ page }) => {
    // 30 ms: over budget at every step, but bearable at the lowest resolution.
    await fakeGpu(page, 30);
    await page.goto('/');
    await requireWebGL(page);
    await toContact(page);
    await drawn(page);
    await expect(figure(page)).toHaveAttribute('data-quality', '0.50', { timeout: 15_000 });
    await expect(figure(page)).toHaveAttribute('data-state', 'running');
  });

  test('a GPU that cannot keep up gets one still frame', async ({ page }) => {
    await fakeGpu(page, 200);
    await page.goto('/');
    await requireWebGL(page);
    await toContact(page);
    await drawn(page);
    await expect(figure(page)).toHaveAttribute('data-state', 'static');
    await expect(figure(page)).toHaveAttribute('data-quality', '0.50');
  });

  test('reduced motion draws one frame', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await requireWebGL(page);
    await toContact(page);
    await drawn(page);
    await expect(figure(page)).toHaveAttribute('data-state', 'static');
  });

  test('without WebGL, or if the shader fails, there is no backdrop', async ({ page }) => {
    await page.addInitScript(() => {
      const getContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (
        this: HTMLCanvasElement,
        type: string,
        ...rest: unknown[]
      ) {
        if (type === 'webgl') return null;
        return (getContext as (...args: unknown[]) => unknown).call(this, type, ...rest);
      } as typeof HTMLCanvasElement.prototype.getContext;
    });
    await page.goto('/');
    await toContact(page);
    await page.waitForTimeout(1500);
    await expect(figure(page)).toBeHidden();
    await expect(page.locator('#contact a[href^="mailto:"]')).toBeVisible();

    const failing = await page.context().newPage();
    await failing.setViewportSize({ width: 390, height: 844 });
    await failing.addInitScript(() => {
      WebGLRenderingContext.prototype.getShaderParameter = () => false;
    });
    await failing.goto('/');
    await toContact(failing);
    await failing.waitForTimeout(1500);
    await expect(figure(failing)).toBeHidden();
  });
});
