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
    // Every entry shows, and the scrolling frame is the keyboard's way to the picture.
    for (const entry of await page.locator('[data-readout] .entry').all()) {
      await expect(entry).toBeVisible();
    }
    await expect(page.locator('#experience .figwrap')).toHaveAttribute('tabindex', '0');
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
    // A focused role scrolls into the frame, and the section passes axe there.
    const firstRole = page.locator('#experience [data-role]').first();
    await firstRole.focus();
    await expect(firstRole).toBeFocused();
    await expect
      .poll(async () => {
        const [role, view] = await Promise.all([firstRole.boundingBox(), frame.boundingBox()]);
        return role!.x >= view!.x - 1 && role!.x < view!.x + view!.width;
      })
      .toBe(true);
    const { violations } = await new AxeBuilder({ page })
      .include('#experience')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(violations).toEqual([]);
  });
});

test.describe('timeline selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
  });

  const shownEntries = (page: Page) =>
    page
      .locator('[data-readout] .entry')
      .evaluateAll((entries) => entries.filter((e) => !(e as HTMLElement).hidden).map((e) => e.id));
  const button = (page: Page, entryId: string) =>
    page.locator(`#experience [data-entry="${entryId}"]`);
  /**
   * Centre of a role's hit area, with the chart in view. Pointing by coordinates: Playwright's
   * own scrolling to an SVG <text> in WebKit measures the text in the wrong place.
   */
  const roleTarget = async (page: Page, entryId: string) => {
    await page
      .locator('#experience svg')
      .evaluate((svg) => svg.scrollIntoView({ block: 'center' }));
    const box = (await button(page, entryId).locator('.hit').boundingBox())!;
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  };

  test('roles and the band become buttons for their list entries', async ({ page }) => {
    await expect(page.locator('#experience svg')).toHaveAttribute('role', 'group');
    const buttons = page.locator('#experience [data-entry]');
    const ids = await page
      .locator('[data-readout] .entry')
      .evaluateAll((entries) => entries.map((e) => e.id));
    expect(await buttons.count()).toBe(ids.length);
    for (const b of await buttons.all()) {
      await expect(b).toHaveAttribute('role', 'button');
      await expect(b).toHaveAttribute('tabindex', '0');
      // The name starts with what the button shows (WCAG 2.5.3, label in name).
      const visible = (await b.locator('tspan').allTextContents()).join(', ');
      expect((await b.getAttribute('aria-label'))!.startsWith(visible)).toBe(true);
      expect(ids).toContain(await b.getAttribute('aria-controls'));
    }
  });

  test('starts on the role that ended last, alone below the chart', async ({ page }) => {
    const latest = await page.locator('#experience [data-role]').evaluateAll((groups) => {
      const end = (g: Element) => Number(g.querySelector('.bar')!.getAttribute('x2'));
      return groups.reduce((a, b) => (end(b) >= end(a) ? b : a)).getAttribute('data-entry');
    });
    expect(await shownEntries(page)).toEqual([latest]);
    await expect(button(page, latest!)).toHaveAttribute('aria-pressed', 'true');
  });

  test('clicking a role or the band shows its entry', async ({ page }) => {
    const [role] = await page
      .locator('#experience [data-role]')
      .evaluateAll((groups) => groups.map((g) => g.getAttribute('data-entry')!));
    const target = await roleTarget(page, role!);
    await page.mouse.click(target.x, target.y);
    expect(await shownEntries(page)).toEqual([role]);
    await expect(button(page, role!)).toHaveAttribute('aria-pressed', 'true');

    const band = await page
      .locator('#experience [data-entry^="education-"]')
      .first()
      .getAttribute('data-entry');
    test.skip(!band, 'No education band');
    const bandBox = (await page.locator('#experience .band').first().boundingBox())!;
    // An empty spot in the band, below the lowest lane's labels.
    await page.mouse.click(bandBox.x + 12, bandBox.y + bandBox.height - 4);
    expect(await shownEntries(page)).toEqual([band]);
    await expect(button(page, role!)).toHaveAttribute('aria-pressed', 'false');
  });

  test('hovering previews roles, not the band', async ({ page }) => {
    const roles = await page
      .locator('#experience [data-role]')
      .evaluateAll((groups) => groups.map((g) => g.getAttribute('data-entry')!));
    const target = await roleTarget(page, roles[1]!);
    await page.mouse.move(target.x, target.y);
    expect(await shownEntries(page)).toEqual([roles[1]]);
    const bandBox = (await page.locator('#experience .band').first().boundingBox())!;
    await page.mouse.move(bandBox.x + 12, bandBox.y + bandBox.height - 4);
    expect(await shownEntries(page)).toEqual([roles[1]]);
  });

  test('keyboard focus previews each item and Enter keeps it', async ({ page }) => {
    const order = await page
      .locator('#experience [data-entry]')
      .evaluateAll((items) => items.map((i) => i.getAttribute('data-entry')!));
    await page.locator('#experience summary').focus();
    for (const id of order) {
      await page.keyboard.press('Tab');
      await expect(button(page, id)).toBeFocused();
      expect(await shownEntries(page)).toEqual([id]);
    }
    await page.keyboard.press('Enter');
    await expect(button(page, order.at(-1)!)).toHaveAttribute('aria-pressed', 'true');
  });

  test('a link to a role selects it', async ({ page }) => {
    const roles = await page
      .locator('#experience [data-role]')
      .evaluateAll((groups) => groups.map((g) => g.getAttribute('data-entry')!));
    await page.evaluate((id) => (window.location.hash = id), roles[0]!);
    await expect.poll(() => shownEntries(page)).toEqual([roles[0]]);
    await expect(page.locator('#experience svg')).toBeInViewport();
  });

  test('skill tags in the details lead to the skill', async ({ page }) => {
    const chips = page.locator('[data-readout] .entry:not([hidden]) .chip');
    expect(await chips.count()).toBeGreaterThan(0);
    for (const chip of await chips.all()) {
      const href = (await chip.getAttribute('href'))!;
      await expect(page.locator(href)).toHaveCount(1);
    }
  });

  test('"How to read this" explains the chart', async ({ page }) => {
    const popover = page.locator('#experience [data-how-to-read]');
    await popover.locator('summary').click();
    await expect(popover.locator('dt')).toHaveText(['Lanes', 'Lines', 'Band', 'Cone']);
    await page.keyboard.press('Escape');
    await expect(popover).not.toHaveAttribute('open', '');
    await expect(popover.locator('summary')).toBeFocused();
  });
});

/** Smallest rendered font size (CSS px) of any text in the chart. */
function smallestText(page: Page) {
  return page.locator('#experience svg').evaluate((svg) => {
    const scale = svg.getBoundingClientRect().width / (svg as SVGSVGElement).viewBox.baseVal.width;
    return Math.min(
      ...[...svg.querySelectorAll('text, tspan')].map(
        (text) => parseFloat(getComputedStyle(text).fontSize) * scale,
      ),
    );
  });
}
