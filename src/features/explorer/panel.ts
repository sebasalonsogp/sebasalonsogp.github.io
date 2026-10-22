// The explorer's visit panel (docs/design-spec.md, "Visit and landing"): domain and month,
// back, title, one-liner, "The short version" / "Engineering log" tabs, actions, stack tags and
// previous / next. Built from the page's embedded data; hidden panels are inert.

import { domains } from '../../data/taxonomy';
import { formatMonth, skillAnchor } from '../../lib/format';
import type { SystemProject } from './system';

export interface PanelHandlers {
  onBack(): void;
  onStep(direction: 1 | -1): void;
}

export interface VisitPanel {
  show(project: SystemProject, position: number, total: number): void;
  hide(): void;
  focusTitle(): void;
  dispose(): void;
}

type Tab = 'brief' | 'log';

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function external(className: string, label: string, href: string): HTMLAnchorElement {
  const link = el('a', className, label);
  link.href = href;
  link.target = '_blank';
  link.rel = 'noopener';
  link.append(el('span', 'sr-only', ' (opens in a new tab)'));
  return link;
}

export function createVisitPanel(hero: HTMLElement, handlers: PanelHandlers): VisitPanel {
  const panel = el('aside', 'explorer-visit');
  panel.setAttribute('aria-labelledby', 'explorer-visit-title');
  panel.inert = true;

  const top = el('div', 'v-top');
  const meta = el('p', 'v-meta eyebrow');
  const back = el('button', 'v-back', '← Back to system ');
  back.type = 'button';
  back.append(el('kbd', undefined, 'Esc'));
  top.append(meta, back);

  const title = el('h2', 'v-title');
  title.id = 'explorer-visit-title';
  title.tabIndex = -1;
  const one = el('p', 'v-one');

  const tabs = el('div', 'v-tabs');
  tabs.setAttribute('role', 'tablist');
  tabs.setAttribute('aria-label', 'Reading depth');
  const tabButtons: Record<Tab, HTMLButtonElement> = {
    brief: el('button', undefined, 'The short version'),
    log: el('button', undefined, 'Engineering log'),
  };
  const body = el('div', 'v-body');
  body.id = 'explorer-visit-body';
  body.setAttribute('role', 'tabpanel');
  for (const [key, button] of Object.entries(tabButtons) as [Tab, HTMLButtonElement][]) {
    button.type = 'button';
    button.id = `explorer-tab-${key}`;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', body.id);
    tabs.append(button);
  }

  const actions = el('div', 'v-actions');
  const stack = el('ul', 'v-stack');
  stack.setAttribute('aria-label', 'Stack');

  const nav = el('nav', 'v-nav');
  nav.setAttribute('aria-label', 'Other projects');
  const previous = el('button', undefined, '← Previous');
  const count = el('span', 'count');
  const next = el('button', undefined, 'Next world →');
  previous.type = next.type = 'button';
  nav.append(previous, count, next);

  panel.append(top, title, one, tabs, body, actions, stack, nav);
  hero.append(panel);

  let project: SystemProject | undefined;
  let tab: Tab = 'brief';

  const setTab = (which: Tab, focus = false) => {
    tab = which;
    for (const [key, button] of Object.entries(tabButtons) as [Tab, HTMLButtonElement][]) {
      const selected = key === which;
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
      if (selected && focus) button.focus();
    }
    body.setAttribute('aria-labelledby', tabButtons[which].id);
    body.replaceChildren(el('p', undefined, project ? project[which] : ''));
  };

  const onTabClick = (event: Event) => {
    const key = (event.currentTarget as HTMLElement).id.replace('explorer-tab-', '') as Tab;
    setTab(key);
  };
  const onTabKey = (event: KeyboardEvent) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    setTab(tab === 'brief' ? 'log' : 'brief', true);
  };
  for (const button of Object.values(tabButtons)) {
    button.addEventListener('click', onTabClick);
    button.addEventListener('keydown', onTabKey);
  }
  const onBack = () => handlers.onBack();
  const onPrevious = () => handlers.onStep(-1);
  const onNext = () => handlers.onStep(1);
  back.addEventListener('click', onBack);
  previous.addEventListener('click', onPrevious);
  next.addEventListener('click', onNext);

  return {
    show(p, position, total) {
      project = p;
      const domain = domains[p.domain];
      const dot = el('i', 'dot');
      dot.style.background = domain.color;
      dot.setAttribute('aria-hidden', 'true');
      meta.replaceChildren(dot, `${domain.label} · ${formatMonth(p.lastCommit)}`);
      title.textContent = p.title;
      one.textContent = p.summary;
      setTab(tab);

      actions.replaceChildren(
        ...(p.demoUrl
          ? [
              external('btn btn-primary', 'Land: open the live demo ↗', p.demoUrl),
              external('btn btn-ghost', 'Source code ↗', p.repoUrl),
            ]
          : [external('btn', 'Read the source ↗', p.repoUrl)]),
      );
      stack.replaceChildren(
        ...p.tech.map((skill) => {
          const item = el('li');
          const link = el('a', 'stk', skill);
          link.href = `#${skillAnchor(skill)}`;
          item.append(link);
          return item;
        }),
      );
      count.textContent = `${position} of ${total}`;

      panel.inert = false;
      panel.classList.add('is-open');
    },
    hide() {
      panel.classList.remove('is-open');
      panel.inert = true;
    },
    focusTitle() {
      title.focus({ preventScroll: true });
    },
    dispose() {
      for (const button of Object.values(tabButtons)) {
        button.removeEventListener('click', onTabClick);
        button.removeEventListener('keydown', onTabKey);
      }
      back.removeEventListener('click', onBack);
      previous.removeEventListener('click', onPrevious);
      next.removeEventListener('click', onNext);
      panel.remove();
    },
  };
}
