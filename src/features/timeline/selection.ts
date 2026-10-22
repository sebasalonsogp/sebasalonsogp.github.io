// Timeline selection (docs/design-spec.md, "Experience timeline"): the roles and the college
// band become buttons, and the selected one's entry from the readable list is the only one
// shown, right below the chart. Pointing or focusing previews a role; clicking or Enter
// selects it too. Without JavaScript the chart stays a picture and the whole list shows.

import { reducedMotion } from '../motion/motion';

export interface TimelineSelection {
  select(entryId: string): void;
  dispose(): void;
}

interface Item {
  button: SVGGElement;
  entry: HTMLElement;
}

export function enhanceTimeline(section: HTMLElement): TimelineSelection | null {
  const svg = section.querySelector<SVGSVGElement>('svg[data-timeline]');
  const readout = section.querySelector<HTMLElement>('[data-readout]');
  if (!svg || !readout) return null;

  const items: Item[] = [];
  for (const button of svg.querySelectorAll<SVGGElement>('[data-entry]')) {
    const entry = document.getElementById(button.dataset.entry!);
    if (entry && readout.contains(entry)) items.push({ button, entry });
  }
  if (!items.length) return null;

  // From a picture to a group of buttons; the buttons make the scrolling frame reachable, so
  // the frame itself no longer needs to be a tab stop.
  svg.setAttribute('role', 'group');
  // Chromium otherwise makes the SVG itself a tab stop before its buttons.
  svg.setAttribute('tabindex', '-1');
  svg.closest('.figwrap')?.removeAttribute('tabindex');
  for (const { button, entry } of items) {
    button.tabIndex = 0;
    button.setAttribute('role', 'button');
    button.setAttribute('aria-controls', entry.id);
    button.setAttribute('aria-pressed', 'false');
  }
  readout.dataset.single = '';

  let current: Item | null = null;

  const show = (item: Item, animate = true) => {
    if (item === current) return;
    current = item;
    svg.classList.add('has-selection');
    for (const other of items) {
      const selected = other === item;
      other.button.classList.toggle('is-selected', selected);
      other.button.setAttribute('aria-pressed', String(selected));
      other.entry.hidden = !selected;
    }
    if (animate && !reducedMotion.matches) {
      item.entry.animate(
        [
          { opacity: 0, transform: 'translateY(6px)' },
          { opacity: 1, transform: 'none' },
        ],
        { duration: 380, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)' },
      );
    }
  };

  const itemFor = (target: EventTarget | null) =>
    items.find(({ button }) => button === (target as Element | null)?.closest('[data-entry]'));

  const onClick = (event: MouseEvent) => {
    const item = itemFor(event.target);
    if (item) show(item);
  };
  const onKey = (event: KeyboardEvent) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const item = itemFor(event.target);
    if (!item) return;
    event.preventDefault();
    show(item);
  };
  // Mouse hover previews roles; touch taps arrive as clicks. The band spans the whole college
  // period, so it only responds to a click (else crossing it would keep stealing the view).
  const onOver = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') return;
    const item = itemFor(event.target);
    if (item?.button.dataset.role !== undefined) show(item);
  };
  const onFocus = (event: FocusEvent) => {
    const item = itemFor(event.target);
    if (item) show(item);
  };

  /** Selects the entry a `#role-…` / `#education-…` link points to, and scrolls to the chart. */
  const showHash = () => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    const item = items.find(({ entry }) => entry.id === id);
    if (!item) return;
    show(item, false);
    section.scrollIntoView({ block: 'start' });
  };

  svg.addEventListener('click', onClick);
  svg.addEventListener('keydown', onKey);
  svg.addEventListener('pointerover', onOver);
  svg.addEventListener('focusin', onFocus);
  window.addEventListener('hashchange', showHash);

  const first = items.find(({ button }) => button.dataset.entry === svg.dataset.default);
  show(first ?? items[0]!, false);
  showHash();

  // Phones: start the scrolled frame at the selected role.
  const frame = svg.closest<HTMLElement>('.figwrap');
  if (frame && current && frame.scrollWidth > frame.clientWidth) {
    const box = (current as Item).button.getBoundingClientRect();
    frame.scrollLeft += box.left - frame.getBoundingClientRect().left - 40;
  }

  return {
    select(entryId) {
      const item = items.find(({ entry }) => entry.id === entryId);
      if (item) show(item);
    },
    dispose() {
      svg.removeEventListener('click', onClick);
      svg.removeEventListener('keydown', onKey);
      svg.removeEventListener('pointerover', onOver);
      svg.removeEventListener('focusin', onFocus);
      window.removeEventListener('hashchange', showHash);
    },
  };
}
