import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { open, projectPaths, settled } from './helpers';

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

test.describe('accessibility (axe, WCAG 2.2 AA)', () => {
  test('home page has no violations', async ({ page }) => {
    await page.goto('/');
    await settled(page);
    const { violations } = await new AxeBuilder({ page }).withTags(WCAG).analyze();
    expect(violations).toEqual([]);
  });

  test('project pages have no violations', async ({ page }) => {
    test.slow();
    for (const path of await projectPaths(page)) {
      await open(page, path);
      await settled(page);
      const { violations } = await new AxeBuilder({ page }).withTags(WCAG).analyze();
      expect(violations, path).toEqual([]);
    }
  });
});
