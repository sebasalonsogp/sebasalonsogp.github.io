import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
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

/**
 * WCAG 2.2 target size (2.5.8, AA): every pointer target is effectively 24×24 px (measured,
 * or clicks 12 px from its centre still reach it), or it is a link inside a run of text, or a
 * 24 px circle around it touches no other target (the spacing exception).
 */
const undersizedTargets = (page: Page) =>
  page.evaluate(() => {
    const selector =
      'a[href], button, summary, input, select, textarea, [role="button"], [tabindex="0"]';
    const targets = [...document.querySelectorAll<HTMLElement | SVGElement>(selector)].filter(
      (el) => {
        const box = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        return (
          box.width > 0 &&
          box.height > 0 &&
          style.visibility !== 'hidden' &&
          style.pointerEvents !== 'none' &&
          !el.closest('[hidden], [inert], [aria-hidden="true"]')
        );
      },
    );
    const reaches = (el: Element, x: number, y: number) => {
      const hit = document.elementFromPoint(x, y);
      return hit !== null && (hit === el || el.contains(hit));
    };
    const inText = (el: Element) => {
      if (getComputedStyle(el).display !== 'inline') return false;
      const block = el.closest('p, li, dd, td');
      return block !== null && block.textContent!.trim().length > el.textContent!.trim().length;
    };
    const small: { el: Element; label: string; cx: number; cy: number }[] = [];
    for (const el of targets) {
      el.scrollIntoView({ block: 'center', inline: 'center' });
      const box = el.getBoundingClientRect();
      const cx = box.left + box.width / 2;
      const cy = box.top + box.height / 2;
      const big =
        (box.width >= 24 && box.height >= 24) ||
        [
          [cx - 11.5, cy],
          [cx + 11.5, cy],
          [cx, cy - 11.5],
          [cx, cy + 11.5],
        ].every(([x, y]) => reaches(el, x!, y!));
      if (big || inText(el)) continue;
      const label = (el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 40);
      small.push({ el, label, cx: cx + window.scrollX, cy: cy + window.scrollY });
    }
    // Spacing exception, in page coordinates.
    const rects = targets.map((el) => {
      const r = el.getBoundingClientRect();
      return {
        el,
        l: r.left + scrollX,
        t: r.top + scrollY,
        r: r.right + scrollX,
        b: r.bottom + scrollY,
      };
    });
    return small
      .filter((s) => {
        const touchesTarget = rects.some(({ el, l, t, r, b }) => {
          if (el === s.el || el.contains(s.el) || s.el.contains(el)) return false;
          const dx = Math.max(l - s.cx, 0, s.cx - r);
          const dy = Math.max(t - s.cy, 0, s.cy - b);
          return Math.hypot(dx, dy) < 12;
        });
        const touchesCircle = small.some(
          (o) => o !== s && Math.hypot(o.cx - s.cx, o.cy - s.cy) < 24,
        );
        return touchesTarget || touchesCircle;
      })
      .map((s) => s.label);
  });

for (const [width, height] of [
  [1440, 900],
  [390, 844],
] as const) {
  test(`pointer targets meet WCAG 2.2 target size at ${width} px`, async ({ page }) => {
    test.slow();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width, height });
    for (const path of ['/', '/projects/eigenflow/', '/no-such-page/']) {
      await open(page, path);
      await settled(page);
      expect(await undersizedTargets(page), path).toEqual([]);
    }
  });
}
