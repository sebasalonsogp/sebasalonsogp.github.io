import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const hero = (page: Page) => page.locator('#hero');
const panel = (page: Page) => page.locator('.explorer-visit');
const title = (page: Page) => page.locator('#explorer-visit-title');

const supportsWebGL2 = (page: Page) =>
  page.evaluate(() => Boolean(document.createElement('canvas').getContext('webgl2')));

/** Loads the home page with the explorer ready; reduced motion makes every flight instant. */
async function ready(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  test.skip(!(await supportsWebGL2(page)), 'No WebGL2 in this browser');
  await expect(hero(page)).toHaveAttribute('data-explorer', 'static', { timeout: 10_000 });
}

const projectList = (page: Page) =>
  page.locator('[data-project-row]').evaluateAll((rows) =>
    rows.map((row) => ({
      id: row.getAttribute('data-project-row')!,
      title: row.querySelector('h3')!.textContent!.trim(),
    })),
  );

test.describe('visits', () => {
  test.beforeEach(async ({ page }) => ready(page));

  test('a planet label opens the visit in place, focused on its title', async ({ page }) => {
    const [first] = await projectList(page);
    await page.locator(`.planet-label[data-project="${first!.id}"]`).click();
    await expect(hero(page)).toHaveAttribute('data-mode', 'visit');
    await expect(title(page)).toHaveText(first!.title);
    await expect(title(page)).toBeFocused();
    await expect(page).toHaveURL((url) => url.pathname === '/');
    await expect(page.locator('.explorer-labels')).toHaveClass(/is-hidden/);
  });

  test('clicking a planet visits it', async ({ page }) => {
    const [first] = await projectList(page);
    const label = page.locator(`.planet-label[data-project="${first!.id}"]`);
    await label.hover();
    const ring = (await page.locator('.highlight-ring').boundingBox())!;
    await page.mouse.move(5, 5);
    await page.mouse.click(ring.x + ring.width / 2, ring.y + ring.height / 2);
    await expect(hero(page)).toHaveAttribute('data-mode', 'visit');
    await expect(title(page)).toHaveText(first!.title);
  });

  test('a project row scrolls up and opens the visit', async ({ page }) => {
    const list = await projectList(page);
    const target = list.at(-1)!;
    const row = page.locator(`[data-project-row="${target.id}"]`);
    await row.scrollIntoViewIfNeeded();
    const box = (await row.boundingBox())!;
    await page.mouse.click(box.x + box.width * 0.6, box.y + box.height / 2);
    await expect(hero(page)).toHaveAttribute('data-mode', 'visit');
    await expect(title(page)).toHaveText(target.title);
    await expect(hero(page)).toBeInViewport();
  });

  test('tabs switch between the short version and the engineering log', async ({ page }) => {
    await page.locator('.planet-label').first().click();
    const brief = page.getByRole('tab', { name: 'The short version' });
    const log = page.getByRole('tab', { name: 'Engineering log' });
    await expect(brief).toHaveAttribute('aria-selected', 'true');
    const briefText = await page.getByRole('tabpanel').textContent();
    await brief.focus();
    await page.keyboard.press('ArrowRight');
    await expect(log).toBeFocused();
    await expect(log).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tabpanel')).not.toHaveText(briefText!);
    await brief.click();
    await expect(page.getByRole('tabpanel')).toHaveText(briefText!);
  });

  test('previous and next hop between worlds and wrap around', async ({ page }) => {
    const list = await projectList(page);
    await page.locator(`.planet-label[data-project="${list[0]!.id}"]`).click();
    await expect(panel(page).locator('.count')).toHaveText(`1 of ${list.length}`);
    await page.getByRole('button', { name: 'Next world →' }).click();
    await expect(title(page)).toHaveText(list[1]!.title);
    await page.getByRole('button', { name: '← Previous' }).click();
    await page.getByRole('button', { name: '← Previous' }).click();
    await expect(title(page)).toHaveText(list.at(-1)!.title);
    await expect(panel(page).locator('.count')).toHaveText(`${list.length} of ${list.length}`);
  });

  test('Escape and the back button return to the system and restore focus', async ({ page }) => {
    const label = page.locator('.planet-label').first();
    await label.focus();
    await page.keyboard.press('Enter');
    await expect(hero(page)).toHaveAttribute('data-mode', 'visit');
    await page.keyboard.press('Escape');
    await expect(hero(page)).toHaveAttribute('data-mode', 'explore');
    await expect(label).toBeFocused();
    await expect(panel(page)).not.toHaveClass(/is-open/);

    await label.click();
    await page.getByRole('button', { name: /Back to system/ }).click();
    await expect(hero(page)).toHaveAttribute('data-mode', 'explore');
    await expect(label).toBeFocused();
  });

  test('the closed panel is inert and the open one has no axe violations', async ({ page }) => {
    expect(await panel(page).evaluate((el) => (el as HTMLElement).inert)).toBe(true);
    await page.locator('.planet-label').first().click();
    expect(await panel(page).evaluate((el) => (el as HTMLElement).inert)).toBe(false);
    const { violations } = await new AxeBuilder({ page })
      .include('.explorer-visit')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(violations).toEqual([]);
  });
});

test.describe('visits with motion', () => {
  test('the camera flies, then arrives (explore → flying → visit → returning → explore)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    test.skip(!(await supportsWebGL2(page)), 'No WebGL2 in this browser');
    await expect(hero(page)).toHaveAttribute('data-explorer', 'running', { timeout: 10_000 });
    // Orbiting labels never hold still for a pointer click; the keyboard opens the visit too.
    await page.locator('.planet-label').first().focus();
    await page.keyboard.press('Enter');
    await expect(hero(page)).toHaveAttribute('data-mode', 'flying');
    await expect(hero(page)).toHaveAttribute('data-mode', 'visit', { timeout: 5_000 });
    await page.keyboard.press('Escape');
    await expect(hero(page)).toHaveAttribute('data-mode', 'returning');
    await expect(hero(page)).toHaveAttribute('data-mode', 'explore', { timeout: 5_000 });
  });
});
