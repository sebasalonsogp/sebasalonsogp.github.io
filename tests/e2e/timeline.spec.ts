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
  await page.locator('#experience svg').evaluate((svg) => svg.scrollIntoView({ block: 'center' }));
  const box = (await button(page, entryId).locator('.hit').boundingBox())!;
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
};

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
    for (const entry of await page.locator('[data-readout] .entry:not(.status)').all()) {
      await expect(entry).toBeVisible();
    }
    await expect(page.locator('#experience .figwrap')).toHaveAttribute('tabindex', '0');
    await expect(page.locator('[data-timeline-controls]')).toBeHidden();
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

  test('roles and the band become buttons for their list entries', async ({ page }) => {
    await expect(page.locator('#experience svg')).toHaveAttribute('role', 'group');
    const buttons = page.locator('#experience [data-entry]');
    const ids = await page
      .locator('[data-readout] .entry:not(.status)')
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
    // Tab order: the key, "Play the timeline", then the band and the roles.
    await page.locator('[data-play]').focus();
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

test.describe('timeline playback', () => {
  // A fake clock drives timers and animation frames, so a whole playback runs in moments.
  test.beforeEach(async ({ page }) => {
    await page.clock.install();
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
  });

  const play = (page: Page) => page.locator('[data-play]');
  const label = (page: Page) => page.locator('[data-play-label]');
  const svg = (page: Page) => page.locator('#timeline-chart');
  /** Role entries in the order they started. */
  const order = (page: Page) =>
    page.locator('#experience [data-role]').evaluateAll((groups) =>
      groups
        .map((g) => ({ id: g.getAttribute('data-entry')!, t0: Number(g.getAttribute('data-t0')) }))
        .sort((a, b) => a.t0 - b.t0)
        .map((r) => r.id),
    );
  const barEnds = (page: Page) =>
    page
      .locator('#experience .wr .bar')
      .evaluateAll((bars) => bars.map((bar) => bar.getAttribute('x2')));
  /** Advances the clock in small steps until `check` holds. */
  const advanceUntil = async (page: Page, check: () => Promise<boolean>, maxMs = 10_000) => {
    for (let elapsed = 0; elapsed <= maxMs; elapsed += 100) {
      if (await check()) return;
      await page.clock.runFor(100);
    }
    throw new Error(`Still waiting after ${maxMs} ms of page time`);
  };
  const showing = (page: Page, id: string) => async () =>
    JSON.stringify(await shownEntries(page)) === JSON.stringify([id]);

  test('walks the roles in start order with chart, controls and details on one screen, then ends at now', async ({
    page,
  }) => {
    test.slow();
    const ids = await order(page);
    const fullBars = await barEnds(page);
    await play(page).click();
    await expect(play(page)).toHaveText('Stop');
    await expect(svg(page)).toHaveClass(/is-playing/);
    expect(await shownEntries(page)).toEqual(['timeline-intro']);

    for (const [i, id] of ids.entries()) {
      await advanceUntil(page, showing(page, id));
      await expect(label(page)).toHaveText(`Role ${i + 1} of ${ids.length}`);
      await expect(page.locator('[data-timeline-controls]')).toBeInViewport({ ratio: 1 });
      await expect(svg(page)).toBeInViewport({ ratio: 1 });
      await expect(page.locator(`#${id} h3`)).toBeInViewport({ ratio: 1 });
      // Roles that start later are faded out until the cursor reaches them.
      const future = await page.locator('#experience .wr.is-future').count();
      expect(future).toBe(ids.length - 1 - i);
    }

    await advanceUntil(page, async () => (await play(page).textContent())!.includes('again'));
    expect(await shownEntries(page)).toEqual(['timeline-now']);
    await expect(svg(page)).not.toHaveClass(/is-playing/);
    expect(await barEnds(page)).toEqual(fullBars);
  });

  test('Stop, Escape or selecting a role stops it', async ({ page }) => {
    const ids = await order(page);
    const fullBars = await barEnds(page);
    const start = async () => {
      await play(page).click();
      await advanceUntil(page, showing(page, ids[0]!));
    };

    await start();
    await play(page).click();
    await expect(play(page)).toHaveText('Play the timeline');
    await expect(svg(page)).not.toHaveClass(/is-playing/);
    expect(await barEnds(page)).toEqual(fullBars);
    expect(await shownEntries(page)).toEqual([ids[0]]);

    await start();
    await page.keyboard.press('Escape');
    await expect(svg(page)).not.toHaveClass(/is-playing/);

    await start();
    const target = await roleTarget(page, ids.at(-1)!);
    await page.mouse.click(target.x, target.y);
    await expect(svg(page)).not.toHaveClass(/is-playing/);
    expect(await shownEntries(page)).toEqual([ids.at(-1)]);
    await expect(button(page, ids.at(-1)!)).toHaveAttribute('aria-pressed', 'true');
  });

  test('hovering a role does not interrupt it', async ({ page }) => {
    const ids = await order(page);
    await play(page).click();
    await advanceUntil(page, showing(page, ids[0]!));
    const target = await roleTarget(page, ids.at(-1)!);
    await page.mouse.move(target.x, target.y);
    await page.clock.runFor(200);
    expect(await shownEntries(page)).toEqual([ids[0]]);
    await expect(svg(page)).toHaveClass(/is-playing/);
  });

  test('scrolling the chart away stops it', async ({ page }) => {
    const ids = await order(page);
    await play(page).click();
    await advanceUntil(page, showing(page, ids[0]!));
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(svg(page)).not.toHaveClass(/is-playing/);
  });

  test('with reduced motion it jumps between roles and hides the progress track', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const ids = await order(page);
    await play(page).click();
    await page.clock.runFor(100);
    expect(await shownEntries(page)).toEqual([ids[0]]);
    await expect(page.locator('[data-play-bar] .track')).toBeHidden();
    // 4.6 s on the role, then straight to the next.
    await page.clock.runFor(4600);
    expect(await shownEntries(page)).toEqual([ids[1]]);
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
