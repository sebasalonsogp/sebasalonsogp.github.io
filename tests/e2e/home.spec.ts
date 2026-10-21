import { expect, test } from '@playwright/test';
import { hasHorizontalScroll } from './helpers';

test.describe('home page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('has one h1 and the four content sections', async ({ page }) => {
    await expect(page.locator('h1')).toHaveCount(1);
    for (const name of ['Projects', 'Experience', 'Skills', 'Contact']) {
      await expect(page.getByRole('region', { name, exact: true })).toBeVisible();
    }
  });

  test('every site nav link scrolls to its section', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Site' });
    const links = nav.locator('a[href^="#"]:not(.mark)');
    const count = await links.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const link = links.nth(i);
      const target = page.locator((await link.getAttribute('href'))!);
      await link.click();
      await expect(page).toHaveURL(new RegExp(`${await link.getAttribute('href')}$`));
      await expect(target).toBeInViewport();
      await page.evaluate(() => window.scrollTo(0, 0));
    }
  });

  test('skip link moves focus to the main content', async ({ page, browserName }) => {
    const skip = page.getByRole('link', { name: 'Skip to content' });
    // WebKit follows Safari's default of leaving links out of the Tab order.
    if (browserName === 'webkit') await skip.focus();
    else await page.keyboard.press('Tab');
    await expect(skip).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('main')).toBeFocused();
  });

  test('skill tags in experience point at existing skills', async ({ page }) => {
    const hrefs = await page
      .locator('#experience a[href^="#skill-"]')
      .evaluateAll((links) => links.map((a) => a.getAttribute('href')!));
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of new Set(hrefs)) {
      await expect(page.locator(`#skills ${href}`)).toHaveCount(1);
    }
  });

  test('contact offers email, resume and profiles', async ({ page }) => {
    const contact = page.getByRole('region', { name: 'Contact' });
    const email = (await contact.locator('[data-email-address]').textContent())!.trim();
    await expect(contact.locator(`a[href="mailto:${email}"]`)).toBeVisible();
    await expect(contact.getByRole('link', { name: /Download my resume/ })).toHaveAttribute(
      'href',
      /\.pdf$/,
    );
    await expect(contact.getByRole('link', { name: /LinkedIn/ })).toHaveAttribute(
      'href',
      /^https:\/\/www\.linkedin\.com\//,
    );
    await expect(contact.getByRole('link', { name: /GitHub/ })).toHaveAttribute(
      'href',
      /^https:\/\/github\.com\//,
    );
  });

  test('every resume link downloads the PDF', async ({ page }) => {
    const hrefs = await page
      .locator('a[href$=".pdf"]')
      .evaluateAll((links) => links.map((a) => a.getAttribute('href')!));
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of new Set(hrefs)) {
      const response = await page.request.get(href);
      expect(response.status(), href).toBe(200);
      expect(response.headers()['content-type'], href).toContain('application/pdf');
      expect((await response.body()).subarray(0, 5).toString(), href).toBe('%PDF-');
    }
  });

  test('links that open a new tab are announced and use noopener', async ({ page }) => {
    const external = page.locator('a[target="_blank"]');
    expect(await external.count()).toBeGreaterThan(0);
    for (const link of await external.all()) {
      await expect(link).toHaveAttribute('rel', /noopener/);
      await expect(link).toContainText('(opens in a new tab)');
    }
  });

  test('copy email copies or selects the address', async ({ page }) => {
    const address = (await page.locator('[data-email-address]').textContent())!.trim();
    const button = page.getByRole('button', { name: 'Copy email' });
    await button.click();
    const status = page.locator('[data-copy-status]');
    await expect(status).toHaveText(/Copied|Selected/);

    // Without clipboard permission the button falls back to selecting the address.
    if ((await status.textContent())?.startsWith('Selected')) {
      expect(await page.evaluate(() => String(window.getSelection()))).toBe(address);
    }
    await expect(status).toHaveText('', { timeout: 5_000 });
  });

  test('has no horizontal scroll at 320 px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.reload();
    expect(await hasHorizontalScroll(page)).toBe(false);
  });
});

test.describe('home page without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('keeps all content and contact paths', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#projects .row a')).not.toHaveCount(0);
    await expect(page.locator('#experience .roles > li')).not.toHaveCount(0);
    await expect(page.locator('#skills li[id^="skill-"]')).not.toHaveCount(0);
    await expect(page.locator('a[href^="mailto:"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Copy email' })).toBeHidden();
  });
});
