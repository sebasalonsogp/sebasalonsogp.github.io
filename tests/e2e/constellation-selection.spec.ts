import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { hero, ready, visitTitle } from './helpers';

/** Skills from the readable list with their sources (from its screen-reader text). */
const listedSkills = (page: Page) =>
  page.locator('#skills .group li').evaluateAll((items) =>
    items.map((li) => {
      const uses = li.querySelector('.sr-only')!.textContent!;
      const count = (word: string) => Number(uses.match(new RegExp(`(\\d+) ${word}`))?.[1] ?? 0);
      return {
        name: li.querySelector('.name')!.textContent!.trim(),
        projects: count('project'),
        roles: count('role'),
      };
    }),
  );

const star = (page: Page, name: string) => page.locator(`#skills [data-skill="${name}"]`);
const panelTitle = (page: Page) => page.locator('[data-panel-title]');
const marked = (page: Page, cls: string) =>
  page
    .locator(`#skills .star.${cls}`)
    .evaluateAll((stars) => stars.map((s) => s.getAttribute('data-skill')!).sort());
/** Clicks a star's hit area with the chart in view (see timeline.spec.ts for why). */
const clickStar = async (page: Page, name: string) => {
  await page.locator('#skills svg').evaluate((svg) => svg.scrollIntoView({ block: 'center' }));
  const box = (await star(page, name).locator('.hit').boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
};
/** A skill used in both projects and roles, so every part of the panel shows. */
const sharedSkill = async (page: Page) =>
  (await listedSkills(page)).find((s) => s.projects > 0 && s.roles > 0 && s.name !== 'Python')!;

test.describe('constellation selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
  });

  test('stars become buttons named by their label', async ({ page }) => {
    await expect(page.locator('#skills svg')).toHaveAttribute('role', 'group');
    await expect(page.locator('[data-constellation-controls]')).toBeVisible();
    // One read for all stars (35 round trips per attribute are slow on CI).
    const stars = await page.locator('#skills .star').evaluateAll((all) =>
      all.map((s) => ({
        name: s.getAttribute('data-skill')!,
        role: s.getAttribute('role'),
        controls: s.getAttribute('aria-controls'),
        label: s.getAttribute('aria-label') ?? '',
      })),
    );
    expect(stars.length).toBeGreaterThan(0);
    for (const star of stars) {
      expect(star.role, star.name).toBe('button');
      expect(star.controls, star.name).toBe('constellation-panel');
      expect(star.label.startsWith(star.name), star.name).toBe(true);
    }
  });

  test('selecting lights up the skills used with it and lists where', async ({ page }) => {
    const skill = await sharedSkill(page);
    await clickStar(page, skill.name);
    await expect(star(page, skill.name)).toHaveAttribute('aria-pressed', 'true');
    await expect(panelTitle(page)).toHaveText(skill.name);

    const panel = page.locator('#constellation-panel');
    const projectLinks = panel.locator('a[data-visit]');
    const roleLinks = panel.locator('a[href^="#role-"]');
    await expect(projectLinks).toHaveCount(skill.projects);
    await expect(roleLinks).toHaveCount(skill.roles);

    // Lit stars = skills that share a listed project (its stack) or role (its skill tags).
    const projectIds = await projectLinks.evaluateAll((links) =>
      links.map((a) => (a as HTMLElement).dataset.visit!),
    );
    const projectTech = await page.evaluate((ids) => {
      const system = JSON.parse(
        document.querySelector('script[data-explorer-system]')!.textContent!,
      ) as { projects: { id: string; tech: string[] }[] };
      return system.projects.filter((p) => ids.includes(p.id)).flatMap((p) => p.tech);
    }, projectIds);
    const roleIds = await roleLinks.evaluateAll((links) =>
      links.map((a) => a.getAttribute('href')!),
    );
    const roleTech = (
      await Promise.all(roleIds.map((id) => page.locator(`${id} .chip`).allTextContents()))
    ).flat();
    const expected = [...new Set([...projectTech, ...roleTech])]
      .filter((name) => name !== skill.name)
      .sort();
    expect(await marked(page, 'is-near')).toEqual(expected);
    expect(await marked(page, 'is-selected')).toEqual([skill.name]);
    await expect(page.locator('#skills [data-panel-count]')).toContainText(
      `used with ${expected.length} skills`,
    );
  });

  test('Clear, Escape and a click on empty sky return to the overview', async ({ page }) => {
    const skill = await sharedSkill(page);
    const total = await page.locator('#skills .star').count();
    const backToOverview = async () => {
      await expect(page.locator('[data-panel-eyebrow]')).toHaveText('Overview');
      await expect(panelTitle(page)).toHaveText(`${total} skills`);
      expect(await marked(page, 'is-selected')).toEqual([]);
    };
    await clickStar(page, skill.name);
    await page.getByRole('button', { name: 'Clear ×' }).click();
    await backToOverview();

    await clickStar(page, skill.name);
    await page.keyboard.press('Escape');
    await backToOverview();

    await clickStar(page, skill.name);
    const svg = (await page.locator('#skills svg').boundingBox())!;
    await page.mouse.click(svg.x + svg.width - 4, svg.y + 4);
    await backToOverview();
  });

  test('the filter shows skills from projects or from experience', async ({ page }) => {
    const skills = await listedSkills(page);
    const names = (keep: (s: (typeof skills)[number]) => boolean) =>
      skills
        .filter(keep)
        .map((s) => s.name)
        .sort();
    const roleOnly = skills.find((s) => s.projects === 0)!;
    await clickStar(page, roleOnly.name);
    const projects = page.getByRole('button', { name: 'Projects', exact: true });
    await projects.click();
    await expect(projects).toHaveAttribute('aria-pressed', 'true');
    expect(await marked(page, 'is-off')).toEqual(names((s) => s.projects === 0));
    // The selected skill is filtered out, so the panel returns to the overview, recounted.
    await expect(panelTitle(page)).toHaveText(`${names((s) => s.projects > 0).length} skills`);
    await expect(star(page, roleOnly.name)).toHaveAttribute('tabindex', '-1');

    await page.getByRole('button', { name: 'Experience', exact: true }).click();
    expect(await marked(page, 'is-off')).toEqual(names((s) => s.roles === 0));
    await page.getByRole('button', { name: 'All', exact: true }).click();
    expect(await marked(page, 'is-off')).toEqual([]);
  });

  test('keyboard focus selects a star, and the most used list selects too', async ({ page }) => {
    await page.getByRole('button', { name: 'Experience', exact: true }).focus();
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.getAttribute('data-skill'));
    expect(focused).toBeTruthy();
    await expect(panelTitle(page)).toHaveText(focused!);

    await page.getByRole('button', { name: 'Clear ×' }).click();
    const first = page.locator('#constellation-panel li:not(.list-head) button').first();
    const name = (await first.textContent())!.split(' · ')[0]!;
    await first.click();
    await expect(panelTitle(page)).toHaveText(name);
  });

  test('a skill tag in the timeline selects its star, again on a second click', async ({
    page,
  }) => {
    const chip = page.locator('[data-readout] .entry:not([hidden]) .chip').first();
    const name = (await chip.textContent())!.trim();
    await chip.click();
    await expect(panelTitle(page)).toHaveText(name);
    await expect(page.locator('#skills svg')).toBeInViewport();
    // The same tag again (the hash does not change) still answers.
    await page.getByRole('button', { name: 'Clear ×' }).click();
    await page.evaluate(() => document.querySelector('#experience')!.scrollIntoView());
    await chip.click();
    await expect(panelTitle(page)).toHaveText(name);
  });

  test('a role in the panel is selected in the timeline', async ({ page }) => {
    await clickStar(page, (await sharedSkill(page)).name);
    const link = page.locator('#constellation-panel a[href^="#role-"]').first();
    const entry = (await link.getAttribute('href'))!.slice(1);
    await link.click();
    await expect(page.locator(`#${entry}`)).toBeVisible();
    await expect(page.locator(`[data-entry="${entry}"]`)).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#experience svg')).toBeInViewport();
  });

  test('the section passes axe with a skill selected', async ({ page }) => {
    await clickStar(page, (await sharedSkill(page)).name);
    const { violations } = await new AxeBuilder({ page })
      .include('#skills')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(violations).toEqual([]);
  });

  test('"How to read this" explains the constellation', async ({ page }) => {
    const popover = page.locator('#skills [data-how-to-read]');
    await popover.locator('summary').click();
    await expect(popover.locator('dt')).toHaveText([
      'Stars',
      'Lines',
      'Filled',
      'Hollow',
      'Ringed',
      'Select',
    ]);
  });
});

test('a project in the skills panel opens its visit in place', async ({ page }) => {
  await ready(page);
  const skill = (await listedSkills(page)).find((s) => s.projects > 0 && s.name !== 'Python')!;
  await clickStar(page, skill.name);
  const link = page.locator('#constellation-panel a[data-visit]').first();
  const id = (await link.getAttribute('data-visit'))!;
  const title = (await link.textContent())!.replace('→', '').trim();
  await link.click();
  await expect(hero(page)).toHaveAttribute('data-mode', 'visit');
  await expect(page).toHaveURL((url) => url.pathname === `/projects/${id}/`);
  await expect(visitTitle(page)).toHaveText(title);
  await expect(hero(page)).toBeInViewport();
});
