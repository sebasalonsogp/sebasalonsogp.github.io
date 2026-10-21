import { expect, test } from '@playwright/test';
import { hasHorizontalScroll, open, projectPaths } from './helpers';

test.describe('project routes', () => {
  test('each project row opens its page', async ({ page }) => {
    const paths = await projectPaths(page);
    expect(paths.length).toBeGreaterThan(0);

    const row = page.locator('#projects .row').first();
    const title = (await row.locator('h3').textContent())!.trim();
    // Clicking the row's description, not the title, still follows the row's link.
    await row.scrollIntoViewIfNeeded();
    const box = (await row.locator('.r-one').boundingBox())!;
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await expect(page).toHaveURL(new RegExp(`${paths[0]}$`));
    await expect(page.locator('h1')).toHaveText(title);
  });

  test('every project page loads directly with its visit open', async ({ page }) => {
    test.slow();
    for (const path of await projectPaths(page)) {
      const id = path.split('/').filter(Boolean).pop()!;
      const response = await open(page, path);
      expect(response?.status(), path).toBe(200);

      const title = (await page.locator('h1').textContent())!.trim();
      await expect(page).toHaveTitle(new RegExp(`^${title} — `));
      await expect(page.locator('#hero')).toHaveAttribute('data-initial-project', id);
      await expect(page.locator('#projects a[aria-current="page"]')).toHaveText(title);
      await expect(page.getByRole('link', { name: '← Back to system' })).toHaveAttribute(
        'href',
        '/',
      );
      await expect(page.getByRole('heading', { name: 'The short version' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Engineering log' })).toBeVisible();
      await expect(page.getByRole('link', { name: /source/i }).first()).toHaveAttribute(
        'href',
        /^https:\/\/github\.com\//,
      );
    }
  });

  test('next links visit every project once and wrap around', async ({ page }) => {
    test.slow();
    const paths = await projectPaths(page);
    await open(page, paths[0]!);
    const visited: string[] = [];
    for (let i = 0; i < paths.length; i++) {
      const here = new URL(page.url()).pathname;
      visited.push(here);
      await page.getByRole('link', { name: /Next world/ }).click({ noWaitAfter: true });
      await page.waitForURL((url) => url.pathname !== here, { waitUntil: 'domcontentloaded' });
    }
    expect(new URL(page.url()).pathname).toBe(paths[0]);
    expect(visited.sort()).toEqual([...paths].sort());
  });

  test('project media loads', async ({ page }) => {
    test.slow();
    for (const path of await projectPaths(page)) {
      await open(page, path);
      for (const img of await page.locator('.visit img').all()) {
        await img.scrollIntoViewIfNeeded();
        await expect(img).toHaveAttribute('alt', /\S/);
        await expect
          .poll(() => img.evaluate((el) => (el as HTMLImageElement).naturalWidth), {
            message: `image on ${path}`,
          })
          .toBeGreaterThan(0);
      }
      for (const source of await page.locator('.visit video source').all()) {
        const src = await source.getAttribute('src');
        const response = await page.request.get(src!);
        expect(response.status(), src!).toBe(200);
        expect(response.headers()['content-type']).toMatch(/^video\//);
      }
    }
  });

  test('project pages have no horizontal scroll at 320 px', async ({ page }) => {
    const paths = await projectPaths(page);
    await page.setViewportSize({ width: 320, height: 700 });
    for (const path of paths) {
      await open(page, path);
      expect(await hasHorizontalScroll(page), path).toBe(false);
    }
  });
});
