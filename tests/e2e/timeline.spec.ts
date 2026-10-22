import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { hasHorizontalScroll } from './helpers';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Roles from the readable list (the same content the chart is drawn from). */
const listedRoles = (page: Page) =>
  page.locator('#experience .roles > li').evaluateAll((entries, months) => {
    const month = (text: string) => {
      const [name, year] = text.trim().split(' ');
      return Number(year) * 12 + months.indexOf(name!);
    };
    return entries.map((entry) => {
      const [from, rest] = entry.querySelector('.mono')!.textContent!.split(' – ');
      const to = rest!.split(' · ')[0]!;
      return {
        id: entry.id.replace(/^role-/, ''),
        lane: entry.querySelector('.eyebrow')!.textContent!.trim(),
        start: month(from!),
        end: to === 'Present' ? null : month(to),
      };
    });
  }, MONTHS);

/** Bars and lane labels from the chart, in viewBox units. */
const chart = (page: Page) =>
  page.locator('#experience svg').evaluate((svg) => ({
    bars: [...svg.querySelectorAll('.wr')].map((g) => {
      const bar = g.querySelector('.bar')!;
      return {
        id: g.getAttribute('data-role')!,
        x0: Number(bar.getAttribute('x1')),
        x1: Number(bar.getAttribute('x2')),
        y: Number(bar.getAttribute('y1')),
      };
    }),
    lanes: [...svg.querySelectorAll('.lane-label')].map((text) => ({
      label: text.textContent!.trim(),
      y: Number(text.getAttribute('y')) - 4,
    })),
    now: Number(svg.querySelector('.now-line')!.getAttribute('x1')),
  }));

test.describe('experience timeline', () => {
  test('draws every listed role once, in its lane', async ({ page }) => {
    await page.goto('/');
    const roles = await listedRoles(page);
    const { bars, lanes } = await chart(page);
    expect(bars.map((b) => b.id).sort()).toEqual(roles.map((r) => r.id).sort());
    for (const role of roles) {
      const bar = bars.find((b) => b.id === role.id)!;
      const lane = lanes.find((l) => l.label === role.lane.toUpperCase());
      expect(lane, role.lane).toBeDefined();
      // A role sits on its lane's first row, or on a row stacked below it.
      const next = lanes.find((l) => l.y > lane!.y);
      expect(bar.y, role.id).toBeGreaterThanOrEqual(lane!.y);
      if (next) expect(bar.y, role.id).toBeLessThan(next.y);
    }
  });

  test('bars follow the listed dates on one time scale, ending by now', async ({ page }) => {
    await page.goto('/');
    const roles = await listedRoles(page);
    const { bars, now } = await chart(page);
    const ended = roles.filter((r) => r.end !== null);
    expect(ended.length).toBeGreaterThan(1);
    // Units per month, measured from each ended role: one shared scale.
    const scales = ended.map((r) => {
      const bar = bars.find((b) => b.id === r.id)!;
      return (bar.x1 - bar.x0) / (r.end! - r.start + 1);
    });
    for (const scale of scales) expect(scale).toBeCloseTo(scales[0]!, 6);
    // Start positions agree with that scale too.
    const [a, b] = ended;
    const barA = bars.find((bar) => bar.id === a!.id)!;
    const barB = bars.find((bar) => bar.id === b!.id)!;
    expect(barB.x0 - barA.x0).toBeCloseTo((b!.start - a!.start) * scales[0]!, 6);
    for (const bar of bars) expect(bar.x1).toBeLessThanOrEqual(now + 1e-6);
  });

  test('is drawn without JavaScript', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.locator('#experience svg .wr').first()).toBeVisible();
    await expect(page.locator('#experience svg')).toHaveAttribute('role', 'img');
    await expect(page.locator('#experience svg')).toHaveAttribute(
      'aria-label',
      /roles are listed below/,
    );
    await context.close();
  });

  test('at 1440 px it fits without scrolling and no text is under 12 px', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await expect(page.locator('#experience .swipe-hint')).toBeHidden();
    const frame = page.locator('#experience .figwrap');
    expect(await frame.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
    expect(await smallestText(page)).toBeGreaterThanOrEqual(12);
  });

  test('on phones it scrolls sideways inside its frame, labels at least 11 px', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await expect(page.locator('#experience .swipe-hint')).toBeVisible();
    const frame = page.locator('#experience .figwrap');
    expect(await frame.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
    expect(await hasHorizontalScroll(page)).toBe(false);
    expect(await smallestText(page)).toBeGreaterThanOrEqual(11);
    // The scrolling frame is reachable by keyboard, and the section passes axe there.
    await frame.focus();
    await expect(frame).toBeFocused();
    const { violations } = await new AxeBuilder({ page })
      .include('#experience')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(violations).toEqual([]);
  });
});

/** Smallest rendered font size (CSS px) of any text in the chart. */
function smallestText(page: Page) {
  return page.locator('#experience svg').evaluate((svg) => {
    const scale = svg.getBoundingClientRect().width / (svg as SVGSVGElement).viewBox.baseVal.width;
    return Math.min(
      ...[...svg.querySelectorAll('text')].map(
        (text) => parseFloat(getComputedStyle(text).fontSize) * scale,
      ),
    );
  });
}
