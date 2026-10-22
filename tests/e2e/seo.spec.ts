import { expect, test, type Page } from '@playwright/test';
import sharp from 'sharp';
import { projectPaths } from './helpers';

/** Absolute production URLs in the head, mapped onto the local server. */
const local = (url: string) => new URL(url).pathname;

const head = (page: Page) =>
  page.evaluate(() => {
    const meta = (key: string) =>
      document
        .querySelector(`meta[property="${key}"], meta[name="${key}"]`)
        ?.getAttribute('content') ?? null;
    const ld = document.querySelector('script[type="application/ld+json"]')?.textContent;
    return {
      title: document.title,
      description: meta('description'),
      robots: meta('robots'),
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null,
      ogTitle: meta('og:title'),
      ogDescription: meta('og:description'),
      ogUrl: meta('og:url'),
      ogImage: meta('og:image'),
      card: meta('twitter:card'),
      data: ld ? (JSON.parse(ld) as Record<string, unknown>) : null,
    };
  });

test.describe('search and sharing', () => {
  test('every page has a canonical URL and sharing tags with its own 1200×630 image', async ({
    page,
  }) => {
    test.slow();
    for (const path of ['/', ...(await projectPaths(page))]) {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      const h = await head(page);
      expect(h.robots, path).toBe('noindex'); // Until launch (Phase 9).
      expect(local(h.canonical!), path).toBe(path);
      expect(h.canonical, path).toMatch(/^https:\/\//);
      expect(h.ogUrl).toBe(h.canonical);
      expect(h.ogTitle).toBe(h.title);
      expect(h.ogDescription).toBe(h.description);
      expect(h.card).toBe('summary_large_image');
      // Each page has its own image (run `npm run og` after adding a project).
      const id = path === '/' ? 'home' : path.split('/').filter(Boolean).pop();
      expect(local(h.ogImage!), path).toBe(`/og/${id}.jpg`);
      const image = await page.request.get(local(h.ogImage!));
      expect(image.status(), path).toBe(200);
      const { width, height, format } = await sharp(await image.body()).metadata();
      expect({ width, height, format }, path).toEqual({ width: 1200, height: 630, format: 'jpeg' });
    }
  });

  test('structured data describes the person and each project from what the page shows', async ({
    page,
  }) => {
    await page.goto('/');
    const home = (await head(page)).data!;
    expect(home['@type']).toBe('Person');
    expect(home.name).toBe((await page.locator('.nav a').first().textContent())!.trim());
    for (const profile of home.sameAs as string[]) {
      await expect(page.locator(`#contact a[href="${profile}"]`)).toHaveCount(1);
    }
    expect(home.email).toBe(
      await page.locator('#contact a[href^="mailto:"]').first().getAttribute('href'),
    );

    for (const path of await projectPaths(page)) {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      const data = (await head(page)).data!;
      expect(data['@type'], path).toBe('SoftwareSourceCode');
      expect(data.name, path).toBe((await page.locator('#visit-title').textContent())!.trim());
      await expect(
        page.locator(`.visit a[href="${data.codeRepository as string}"]`),
      ).not.toHaveCount(0);
    }
  });

  test('the sitemap lists every page, and robots.txt points to it', async ({ page }) => {
    const paths = ['/', ...(await projectPaths(page))];
    const sitemap = await (await page.request.get('/sitemap.xml')).text();
    const listed = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => local(m[1]!));
    expect(listed.sort()).toEqual([...paths].sort());
    for (const path of listed) expect((await page.request.get(path)).status(), path).toBe(200);
    const robots = await (await page.request.get('/robots.txt')).text();
    expect(robots).toMatch(/^Sitemap: https:\/\/\S+\/sitemap\.xml$/m);
    expect(local(robots.match(/^Sitemap: (\S+)$/m)![1]!)).toBe('/sitemap.xml');
  });

  test('icons and the web manifest are served', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const hrefs = await page
      .locator('link[rel="icon"], link[rel="apple-touch-icon"], link[rel="manifest"]')
      .evaluateAll((links) => links.map((l) => l.getAttribute('href')!));
    expect(hrefs.length).toBe(4);
    for (const href of hrefs) expect((await page.request.get(href)).status(), href).toBe(200);
    const manifest = (await (await page.request.get('/site.webmanifest')).json()) as {
      name: string;
      icons: { src: string; sizes: string }[];
    };
    for (const icon of manifest.icons) {
      const { width, height } = await sharp(
        await (await page.request.get(icon.src)).body(),
      ).metadata();
      expect(`${width}x${height}`).toBe(icon.sizes);
    }
  });

  test('the 404 page is not shared or indexed under its URL', async ({ page }) => {
    await page.goto('/no-such-page/');
    const h = await head(page);
    expect(h.canonical).toBeNull();
    expect(h.ogTitle).toBeNull();
    expect(h.data).toBeNull();
    expect(h.robots).toBe('noindex');
  });
});
