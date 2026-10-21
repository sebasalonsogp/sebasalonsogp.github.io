import { expect, test } from '@playwright/test';

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
