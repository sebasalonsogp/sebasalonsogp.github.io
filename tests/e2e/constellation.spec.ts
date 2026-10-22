import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { hasHorizontalScroll } from './helpers';

/** Skills from the readable list: name, group, uses and sources (from its screen-reader text). */
const listedSkills = (page: Page) =>
  page.locator('#skills .group li').evaluateAll((items) =>
    items.map((li) => {
      const uses = li.querySelector('.sr-only')!.textContent!;
      const count = (word: string) => Number(uses.match(new RegExp(`(\\d+) ${word}`))?.[1] ?? 0);
      return {
        name: li.querySelector('.name')!.textContent!.trim(),
        group: li.closest('.group')!.querySelector('h3')!.textContent!.trim(),
        count: Number(li.querySelector('.mono')!.textContent),
        projects: count('project'),
        roles: count('role'),
      };
    }),
  );

/** Stars and lines from the chart, in viewBox units. */
const chart = (page: Page) =>
  page.locator('#skills svg').evaluate((svg) => ({
    stars: [...svg.querySelectorAll('.star')].map((g) => {
      const core = g.querySelector('.core')!;
      return {
        name: g.getAttribute('data-skill')!,
        x: Number(core.getAttribute('cx')),
        y: Number(core.getAttribute('cy')),
        r: Number(core.getAttribute('r')),
        hollow: core.classList.contains('hollow'),
        ring: g.querySelector('.ring') !== null,
      };
    }),
    lines: [...svg.querySelectorAll('.links line')].map((l) => ({
      x1: Number(l.getAttribute('x1')),
      y1: Number(l.getAttribute('y1')),
      x2: Number(l.getAttribute('x2')),
      y2: Number(l.getAttribute('y2')),
    })),
  }));

/** Rendered label boxes that overlap each other or leave the chart, and the smallest size. */
const labelCheck = (page: Page) =>
  page.locator('#skills svg').evaluate((svg) => {
    const frame = svg.getBoundingClientRect();
    const scale = frame.width / (svg as SVGSVGElement).viewBox.baseVal.width;
    const labels = [...svg.querySelectorAll('text')].map((t) => ({
      name: t.textContent!.trim(),
      box: t.getBoundingClientRect(),
      size: parseFloat(getComputedStyle(t).fontSize) * scale,
    }));
    const overlaps: string[] = [];
    for (let i = 0; i < labels.length; i++) {
      for (let j = i + 1; j < labels.length; j++) {
        const a = labels[i]!.box;
        const b = labels[j]!.box;
        if (a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom) {
          overlaps.push(`${labels[i]!.name} / ${labels[j]!.name}`);
        }
      }
    }
    const outside = labels
      .filter(
        ({ box }) =>
          box.left < frame.left ||
          box.right > frame.right ||
          box.top < frame.top ||
          box.bottom > frame.bottom,
      )
      .map(({ name }) => name);
    return { overlaps, outside, smallest: Math.min(...labels.map((l) => l.size)) };
  });

test.describe('skills constellation', () => {
  test('one star per listed skill, sized by use and marked by source', async ({ page }) => {
    await page.goto('/');
    const skills = await listedSkills(page);
    const { stars } = await chart(page);
    expect(stars.map((s) => s.name).sort()).toEqual(skills.map((s) => s.name).sort());
    for (const skill of skills) {
      const star = stars.find((s) => s.name === skill.name)!;
      expect(star.r, skill.name).toBeCloseTo(2.6 + Math.sqrt(skill.count) * 2.3, 1);
      // Filled: used in projects; hollow: only in roles; ringed: both.
      expect(star.hollow, skill.name).toBe(skill.projects === 0);
      expect(star.ring, skill.name).toBe(skill.projects > 0 && skill.roles > 0);
    }
  });

  test('each group is traced by a shortest tree, at most 30 lines', async ({ page }) => {
    await page.goto('/');
    const skills = await listedSkills(page);
    const { stars, lines } = await chart(page);
    expect(lines.length).toBeLessThanOrEqual(30);
    // A tree through n stars has n − 1 lines; the core skill has no group lines.
    const groups = Map.groupBy(
      skills.filter((s) => s.group !== 'Core'),
      (s) => s.group,
    );
    expect(lines.length).toBe([...groups.values()].reduce((sum, g) => sum + g.length - 1, 0));
    // Every line joins two stars of the same group.
    const groupAt = (x: number, y: number) => {
      const star = stars.find((s) => Math.abs(s.x - x) < 0.2 && Math.abs(s.y - y) < 0.2);
      return star && skills.find((s) => s.name === star.name)!.group;
    };
    for (const line of lines) {
      const a = groupAt(line.x1, line.y1);
      expect(a).toBeDefined();
      expect(groupAt(line.x2, line.y2)).toBe(a);
    }
  });

  test('at 1440 px no labels overlap or leave the chart, and none is under 12 px', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    const { overlaps, outside, smallest } = await labelCheck(page);
    expect(overlaps).toEqual([]);
    expect(outside).toEqual([]);
    expect(smallest).toBeGreaterThanOrEqual(12);
    await expect(page.locator('#skills .swipe-hint')).toBeHidden();
    const frame = page.locator('#skills .figwrap');
    expect(await frame.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  });

  test('on phones it scrolls inside its frame with readable labels', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    const frame = page.locator('#skills .figwrap');
    await expect(page.locator('#skills .swipe-hint')).toBeVisible();
    expect(await frame.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
    expect(await hasHorizontalScroll(page)).toBe(false);
    const { overlaps, smallest } = await labelCheck(page);
    expect(overlaps).toEqual([]);
    expect(smallest).toBeGreaterThanOrEqual(12);
    await frame.focus();
    await expect(frame).toBeFocused();
    const { violations } = await new AxeBuilder({ page })
      .include('#skills')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(violations).toEqual([]);
  });

  test('the overview counts the skills and lists the most used', async ({ page }) => {
    await page.goto('/');
    const skills = await listedSkills(page);
    const overview = page.locator('#skills .overview');
    await expect(overview.locator('h3')).toHaveText(`${skills.length} skills`);
    const top = [...skills]
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .slice(0, 6)
      .map((s) => `${s.name} · ${s.count}`);
    await expect(overview.locator('li')).toHaveText(top);
  });

  test('is drawn without JavaScript', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.locator('#skills svg .star').first()).toBeVisible();
    await expect(page.locator('#skills svg')).toHaveAttribute('aria-label', /listed below/);
    await context.close();
  });
});
