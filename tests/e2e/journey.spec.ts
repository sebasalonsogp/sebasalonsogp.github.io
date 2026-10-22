// Whole journeys through the explorer (Explore → Visit → Land → Return), across history and
// devices. Single behaviors are covered in visit.spec.ts; these check they compose.
import { expect, test, type Page } from '@playwright/test';
import { hasHorizontalScroll, hero, mediaCounts, projectList, ready, visitTitle } from './helpers';

const path = (page: Page) => new URL(page.url()).pathname;
const lightbox = (page: Page) => page.locator('dialog.lb');
const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

test.describe('journeys with real flights', () => {
  test.beforeEach(async ({ page }) => ready(page, { motion: true }));

  test('list → fly → land → lightbox → return → another world, then Back and Forward', async ({
    page,
  }) => {
    test.slow();
    const list = await projectList(page);
    const target = (await mediaCounts(page)).find((p) => p.media > 0);
    test.skip(!target || list.length < 2, 'Needs a project with media and a second project');
    const start = await page.evaluate(() => history.length);

    const row = page.locator(`[data-project-row="${target!.id}"]`);
    await row.scrollIntoViewIfNeeded();
    const box = (await row.boundingBox())!;
    await page.mouse.click(box.x + box.width * 0.6, box.y + box.height / 2);
    await expect(hero(page)).toHaveAttribute('data-mode', 'flying');
    await expect(hero(page)).toHaveAttribute('data-mode', 'visit', { timeout: 5_000 });
    await expect(page).toHaveURL((url) => url.pathname === `/projects/${target!.id}/`);

    await expect(page.locator('.landing')).toBeVisible();
    await page.locator('.ld-screen').click();
    await expect(lightbox(page)).toHaveAttribute('open', '');
    await page.keyboard.press('Escape');
    await expect(lightbox(page)).not.toHaveAttribute('open', '');
    await expect(hero(page)).toHaveAttribute('data-mode', 'visit');

    await page.keyboard.press('Escape');
    await expect(hero(page)).toHaveAttribute('data-mode', 'returning');
    await expect(hero(page)).toHaveAttribute('data-mode', 'explore', { timeout: 5_000 });
    expect(path(page)).toBe('/');

    // Orbiting labels never hold still for a pointer click; the keyboard opens the visit too.
    const other = list.find((p) => p.id !== target!.id)!;
    await page.locator(`.planet-label[data-project="${other.id}"]`).focus();
    await page.keyboard.press('Enter');
    await expect(hero(page)).toHaveAttribute('data-mode', 'visit', { timeout: 5_000 });
    await expect(visitTitle(page)).toHaveText(other.title);
    // Each visit from home is one entry; returning stepped back rather than adding one.
    expect(await page.evaluate(() => history.length)).toBe(start + 1);

    await page.goBack();
    await expect(hero(page)).toHaveAttribute('data-mode', 'explore', { timeout: 5_000 });
    expect(path(page)).toBe('/');
    await page.goForward();
    await expect(hero(page)).toHaveAttribute('data-mode', 'visit', { timeout: 5_000 });
    await expect(visitTitle(page)).toHaveText(other.title);
  });

  test('Escape during the flight turns back to the system', async ({ page }) => {
    const label = page.locator('.planet-label').first();
    await label.focus();
    await page.keyboard.press('Enter');
    await expect(hero(page)).toHaveAttribute('data-mode', 'flying');
    await page.keyboard.press('Escape');
    await expect(hero(page)).toHaveAttribute('data-mode', 'explore', { timeout: 5_000 });
    await expect.poll(() => path(page)).toBe('/');
    await expect(label).toBeFocused();
    await expect(page.locator('.explorer-visit')).not.toHaveClass(/is-open/);
  });
});

test.describe('journeys across history', () => {
  test.beforeEach(async ({ page }) => ready(page));

  test('Back with the lightbox open closes it and returns to the system', async ({ page }) => {
    const target = (await mediaCounts(page)).find((p) => p.media > 0);
    test.skip(!target, 'No project with media');
    await page.locator(`.planet-label[data-project="${target!.id}"]`).click();
    await page.locator('.ld-screen').click();
    await expect(lightbox(page)).toHaveAttribute('open', '');

    await page.goBack();
    await expect(hero(page)).toHaveAttribute('data-mode', 'explore');
    await expect(lightbox(page)).not.toHaveAttribute('open', '');
    await expect(page.locator('html')).not.toHaveClass(/is-lightbox-open/);
    expect(path(page)).toBe('/');

    await page.goForward();
    await expect(hero(page)).toHaveAttribute('data-mode', 'visit');
    await expect(lightbox(page)).not.toHaveAttribute('open', '');
    await expect(visitTitle(page)).toBeFocused();
  });

  test('Back during the tour ends it at the system', async ({ page }) => {
    test.slow();
    const tourButton = page.getByRole('button', { name: 'Take the 60-second tour' });
    await tourButton.click();
    await expect(hero(page)).toHaveAttribute('data-mode', 'visit');
    await page.goBack();
    await expect(hero(page)).toHaveAttribute('data-mode', 'explore');
    await expect(page.locator('.tourbar')).toBeHidden();
    expect(path(page)).toBe('/');
    // The next stop (6.5 s with reduced motion) never comes.
    await page.waitForTimeout(7_000);
    await expect(hero(page)).toHaveAttribute('data-mode', 'explore');
    expect(path(page)).toBe('/');
  });

  test('every project URL opens its visit in the explorer, and survives a reload', async ({
    page,
  }) => {
    test.slow();
    for (const { id, title } of await projectList(page)) {
      await page.goto(`/projects/${id}/`, { waitUntil: 'domcontentloaded' });
      await expect(hero(page)).toHaveAttribute('data-mode', 'visit', { timeout: 15_000 });
      await expect(visitTitle(page)).toHaveText(title);
      await expect(page).toHaveTitle(new RegExp(`^${escapeRegExp(title)} — `));
    }

    // A visit opened from home, then reloaded: same visit, and Esc still reaches the system.
    const [first] = await projectList(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(hero(page)).toHaveAttribute('data-explorer', 'static', { timeout: 15_000 });
    await page.locator(`.planet-label[data-project="${first!.id}"]`).click();
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(hero(page)).toHaveAttribute('data-mode', 'visit', { timeout: 15_000 });
    await expect(visitTitle(page)).toHaveText(first!.title);
    await page.keyboard.press('Escape');
    await expect.poll(() => path(page)).toBe('/');
    await expect(page.locator('.intro')).toBeVisible();
    await expect(page.locator('.planet-label').first()).toBeVisible({ timeout: 15_000 });
  });
});

test('on a phone: list → visit → preview → lightbox → back to the system', async ({ page }) => {
  await ready(page);
  await page.setViewportSize({ width: 390, height: 844 });
  const target = (await mediaCounts(page)).find((p) => p.media > 0);
  test.skip(!target, 'No project with media');

  const row = page.locator(`[data-project-row="${target!.id}"]`);
  await row.scrollIntoViewIfNeeded();
  await row.locator('h3 a').click();
  await expect(hero(page)).toHaveAttribute('data-mode', 'visit');
  await expect(hero(page)).toBeInViewport();
  expect(await hasHorizontalScroll(page)).toBe(false);

  const preview = page.locator('.explorer-visit .v-media');
  await preview.scrollIntoViewIfNeeded();
  await preview.click();
  await expect(lightbox(page)).toHaveAttribute('open', '');
  await page.keyboard.press('Escape');
  await expect(lightbox(page)).not.toHaveAttribute('open', '');
  await expect(preview).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(hero(page)).toHaveAttribute('data-mode', 'explore');
  expect(path(page)).toBe('/');
  expect(await hasHorizontalScroll(page)).toBe(false);
});
