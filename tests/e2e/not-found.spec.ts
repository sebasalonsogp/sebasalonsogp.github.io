import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { hasHorizontalScroll } from './helpers';

const blackHoleDrawn = () => {
  const f = document.querySelector<HTMLElement>('[data-black-hole]');
  return f !== null && !f.hidden && f.dataset.pending === undefined;
};

test('unknown paths get the 404 page with a way back', async ({ page }) => {
  const response = await page.goto('/no-such-page/');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'This page fell past the event horizon.',
  );
  await page.getByRole('link', { name: 'Back to the system' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('region', { name: 'Projects' })).toBeVisible();
});

test('the 404 draws the black hole at once, behind the text', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/a/deeper/missing/path/');
  // No scrolling needed: the black hole is this page's hero.
  await page.waitForFunction(blackHoleDrawn, null, { timeout: 30_000 });
  await expect(page.locator('[data-black-hole]')).toHaveAttribute('aria-hidden', 'true');
  const link = page.getByRole('link', { name: 'Back to the system' });
  const box = (await link.boundingBox())!;
  const hit = await page.evaluate(
    ({ x, y }) => document.elementFromPoint(x, y)?.closest('a')?.textContent?.trim(),
    { x: box.x + box.width / 2, y: box.y + box.height / 2 },
  );
  expect(hit).toBe('Back to the system');
  expect(await hasHorizontalScroll(page)).toBe(false);
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(violations).toEqual([]);
});

test('on phones the black hole is a banner above the line', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/no-such-page/');
  await page.waitForFunction(blackHoleDrawn, null, { timeout: 30_000 });
  const banner = (await page.locator('[data-black-hole] canvas').boundingBox())!;
  const heading = (await page.getByRole('heading', { level: 1 }).boundingBox())!;
  expect(banner.y + banner.height).toBeLessThanOrEqual(heading.y);
  expect(await hasHorizontalScroll(page)).toBe(false);
});

test('without WebGL the 404 keeps its line and link, with no empty box', async ({ page }) => {
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
  await page.goto('/no-such-page/');
  await page.waitForTimeout(1500);
  await expect(page.locator('[data-black-hole]')).toBeHidden();
  await expect(page.getByRole('link', { name: 'Back to the system' })).toBeVisible();
});
