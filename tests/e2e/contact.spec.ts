import { expect, test, type Page } from '@playwright/test';

const address = async (page: Page) =>
  (await page.locator('[data-email-address]').textContent())!.trim();
const copyButton = (page: Page) => page.getByRole('button', { name: 'Copy email' });
const status = (page: Page) => page.locator('[data-copy-status]');

test.describe('contact', () => {
  test('copy email puts the address on the clipboard', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'Clipboard permissions can be granted only in Chromium');
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/');
    await copyButton(page).click();
    await expect(status(page)).toHaveText('Copied');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(await address(page));
  });

  test('without clipboard access it selects the address for the shortcut', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    });
    await page.goto('/');
    await expect(copyButton(page)).toBeVisible();
    // Click and read in one go: the status clears itself after 2.4 s, and a busy CI runner
    // once took longer than that to look (the real click is covered by home.spec.ts).
    const result = await page.evaluate(async () => {
      document.querySelector<HTMLButtonElement>('[data-copy-email]')!.click();
      await new Promise((resolve) => setTimeout(resolve, 50));
      return {
        status: document.querySelector('[data-copy-status]')!.textContent,
        selection: String(window.getSelection()),
      };
    });
    expect(result.status).toMatch(/^Selected\. Press (Ctrl\+C|⌘C) to copy\.$/);
    expect(result.selection).toBe(await address(page));
  });

  test('the resume card downloads the PDF and gives its size', async ({ page }) => {
    await page.goto('/');
    const card = page.getByRole('link', { name: /Download my resume/ });
    const href = (await card.getAttribute('href'))!;
    await expect(card).toHaveAttribute('download', /\.pdf$/);
    await expect(card).not.toHaveAttribute('target', /.*/);
    const response = await page.request.get(href);
    const kb = Math.max(1, Math.round((await response.body()).length / 1024));
    await expect(card).toContainText(`PDF · ${kb} KB`);

    const [download] = await Promise.all([page.waitForEvent('download'), card.click()]);
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  });

  test('the phone number is a call link', async ({ page }) => {
    await page.goto('/');
    const link = page.locator('#contact a[href^="tel:"]');
    test.skip((await link.count()) === 0, 'Phone not shown');
    const digits = (await link.textContent())!.replace(/\D/g, '');
    await expect(link).toHaveAttribute('href', new RegExp(`^tel:(\\+1)?${digits}$`));
  });
});
