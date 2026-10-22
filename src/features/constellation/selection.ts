// Constellation selection (docs/design-spec.md, "Skills constellation"): stars become buttons.
// Selecting one turns it --sol, keeps the skills used alongside it bright and fades the rest,
// and the panel lists the projects (opening their visit) and roles (selecting them in the
// timeline) that use it. "Clear ×", Escape or a click on empty sky returns to the overview.
// All / Projects / Experience filters the stars. Links to `#skill-…` select that star.

import { skillAnchor } from '../../lib/format';

export interface ConstellationData {
  skills: Record<
    string,
    {
      count: number;
      projects: { id: string; title: string; href: string; color: string }[];
      roles: { entry: string; title: string }[];
      /** Skills used in the same projects or roles. */
      with: string[];
    }
  >;
  /** Skill names per group, for the overview's group count. */
  groups: string[][];
  projectCount: number;
  roleCount: number;
}

type Filter = 'all' | 'project' | 'role';

const MOST_USED = 6;

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function enhanceConstellation(section: HTMLElement): { dispose(): void } | null {
  const svg = section.querySelector<SVGSVGElement>('svg[data-constellation]');
  const json = section.querySelector('script[data-constellation-data]');
  const panel = section.querySelector<HTMLElement>('[data-panel]');
  const controls = section.querySelector<HTMLElement>('[data-constellation-controls]');
  if (!svg || !json || !panel || !controls) return null;
  const eyebrow = panel.querySelector<HTMLElement>('[data-panel-eyebrow]')!;
  const clear = panel.querySelector<HTMLButtonElement>('[data-panel-clear]')!;
  const title = panel.querySelector<HTMLElement>('[data-panel-title]')!;
  const count = panel.querySelector<HTMLElement>('[data-panel-count]')!;
  const list = panel.querySelector<HTMLElement>('[data-panel-list]')!;
  const data = JSON.parse(json.textContent!) as ConstellationData;

  const stars = new Map<string, SVGGElement>();
  for (const star of svg.querySelectorAll<SVGGElement>('[data-skill]')) {
    if (data.skills[star.dataset.skill!]) stars.set(star.dataset.skill!, star);
  }
  if (!stars.size) return null;
  const lines = [...svg.querySelectorAll<SVGLineElement>('.links line')];
  // Which stars each line joins (by position), so the filter can dim lines to hidden stars.
  const at = (x: string | null, y: string | null) =>
    [...stars.keys()].find((name) => {
      const core = stars.get(name)!.querySelector('.core')!;
      return (
        Math.abs(Number(core.getAttribute('cx')) - Number(x)) < 0.2 &&
        Math.abs(Number(core.getAttribute('cy')) - Number(y)) < 0.2
      );
    });
  const lineEnds = lines.map((line) => [
    at(line.getAttribute('x1'), line.getAttribute('y1')),
    at(line.getAttribute('x2'), line.getAttribute('y2')),
  ]);

  // From a picture to a group of buttons.
  svg.setAttribute('role', 'group');
  svg.setAttribute('tabindex', '-1');
  svg.closest('.figwrap')?.removeAttribute('tabindex');
  for (const star of stars.values()) {
    star.tabIndex = 0;
    star.setAttribute('role', 'button');
    star.setAttribute('aria-pressed', 'false');
    star.setAttribute('aria-controls', panel.id);
  }
  controls.hidden = false;

  let filter: Filter = 'all';
  let current: string | null = null;
  const filterButtons = [...controls.querySelectorAll<HTMLButtonElement>('[data-filter]')];

  const visible = (name: string) => {
    const skill = data.skills[name]!;
    return filter === 'all' || (filter === 'project' ? skill.projects : skill.roles).length > 0;
  };

  const heading = (text: string) => list.append(el('li', 'list-head', text));
  const icon = (role: boolean, color?: string) => {
    const dot = el('i', role ? 'ico role' : 'ico');
    dot.setAttribute('aria-hidden', 'true');
    if (color) dot.style.background = color;
    return dot;
  };

  const overview = () => {
    current = null;
    svg.classList.remove('has-selection');
    for (const star of stars.values()) {
      star.classList.remove('is-selected', 'is-near');
      star.setAttribute('aria-pressed', 'false');
    }
    const pool = [...stars.keys()]
      .filter(visible)
      .sort((a, b) => data.skills[b]!.count - data.skills[a]!.count || a.localeCompare(b));
    eyebrow.textContent = 'Overview';
    clear.hidden = true;
    title.textContent = plural(pool.length, 'skill');
    const groupCount = data.groups.filter((g) => g.some(visible)).length;
    count.textContent = `${plural(groupCount, 'group')} · from ${plural(
      data.projectCount,
      'project',
    )} and ${plural(data.roleCount, 'role')}`;
    list.replaceChildren();
    heading('Most used');
    for (const name of pool.slice(0, MOST_USED)) {
      const skill = data.skills[name]!;
      const item = el('li');
      const button = el('button');
      button.type = 'button';
      button.append(icon(skill.projects.length === 0), `${name} · ${skill.count}`);
      button.addEventListener('click', () => select(name));
      item.append(button);
      list.append(item);
    }
  };

  const select = (name: string) => {
    const skill = data.skills[name];
    if (!skill || !visible(name)) return;
    current = name;
    const near = new Set(skill.with.filter((other) => stars.has(other) && visible(other)));
    svg.classList.add('has-selection');
    for (const [other, star] of stars) {
      star.classList.toggle('is-selected', other === name);
      star.classList.toggle('is-near', near.has(other));
      star.setAttribute('aria-pressed', String(other === name));
    }
    eyebrow.textContent = 'Selected skill';
    clear.hidden = false;
    title.textContent = name;
    count.textContent = [
      skill.projects.length > 0 && plural(skill.projects.length, 'project'),
      skill.roles.length > 0 && plural(skill.roles.length, 'role'),
      `used with ${plural(near.size, 'skill')}`,
    ]
      .filter(Boolean)
      .join(' · ');
    list.replaceChildren();
    if (skill.projects.length) {
      heading('Projects');
      for (const project of skill.projects) {
        const item = el('li');
        const link = el('a');
        link.href = project.href;
        link.dataset.visit = project.id;
        link.append(icon(false, project.color), `${project.title} →`);
        item.append(link);
        list.append(item);
      }
    }
    if (skill.roles.length) {
      heading('Experience');
      for (const role of skill.roles) {
        const item = el('li');
        const link = el('a');
        link.href = `#${role.entry}`;
        link.append(icon(true), `${role.title} →`);
        item.append(link);
        list.append(item);
      }
    }
  };

  const applyFilter = () => {
    for (const [name, star] of stars) {
      const off = !visible(name);
      star.classList.toggle('is-off', off);
      star.tabIndex = off ? -1 : 0;
      if (off) star.setAttribute('aria-hidden', 'true');
      else star.removeAttribute('aria-hidden');
    }
    lines.forEach((line, i) => {
      const [a, b] = lineEnds[i]!;
      line.classList.toggle('is-off', !(a && visible(a) && b && visible(b)));
    });
    if (current && visible(current)) select(current);
    else overview();
  };

  const starFor = (target: EventTarget | null) =>
    (target as Element | null)?.closest<SVGGElement>('[data-skill]')?.dataset.skill;

  const onClick = (event: MouseEvent) => {
    const name = starFor(event.target);
    if (name) select(name);
    else overview();
  };
  const onKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && current) {
      overview();
      return;
    }
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const name = starFor(event.target);
    if (!name) return;
    event.preventDefault();
    select(name);
  };
  const onFocus = (event: FocusEvent) => {
    const name = starFor(event.target);
    if (name) select(name);
  };
  const onFilter = (event: Event) => {
    const button = event.currentTarget as HTMLButtonElement;
    filter = button.dataset.filter as Filter;
    for (const other of filterButtons) {
      other.setAttribute('aria-pressed', String(other === button));
    }
    applyFilter();
  };

  /** `#skill-…` links (the timeline's skill tags) select that star and bring the chart into view. */
  const showHash = () => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    const name = [...stars.keys()].find((skill) => skillAnchor(skill) === id);
    if (!name) return;
    if (!visible(name)) {
      filter = 'all';
      for (const other of filterButtons) {
        other.setAttribute('aria-pressed', String(other.dataset.filter === 'all'));
      }
      applyFilter();
    }
    select(name);
    section.scrollIntoView({ block: 'start' });
  };
  // Following the same link twice does not change the hash; treat it as a new request.
  const onDocumentClick = (event: MouseEvent) => {
    const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
    if (link && link.getAttribute('href') === window.location.hash) {
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    }
  };

  svg.addEventListener('click', onClick);
  svg.addEventListener('keydown', onKey);
  svg.addEventListener('focusin', onFocus);
  clear.addEventListener('click', overview);
  for (const button of filterButtons) button.addEventListener('click', onFilter);
  window.addEventListener('hashchange', showHash);
  document.addEventListener('click', onDocumentClick);

  overview();
  showHash();

  return {
    dispose() {
      svg.removeEventListener('click', onClick);
      svg.removeEventListener('keydown', onKey);
      svg.removeEventListener('focusin', onFocus);
      clear.removeEventListener('click', overview);
      for (const button of filterButtons) button.removeEventListener('click', onFilter);
      window.removeEventListener('hashchange', showHash);
      document.removeEventListener('click', onDocumentClick);
    },
  };
}
