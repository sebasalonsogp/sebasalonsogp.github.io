// Timeline selection (docs/design-spec.md, "Experience timeline"): the roles and the college
// band become buttons, and the selected one's entry from the readable list is the only one
// shown, right below the chart. Pointing or focusing previews a role; clicking or Enter
// selects it too. Without JavaScript the chart stays a picture and the whole list shows.

import { reducedMotion } from '../motion/motion';

export interface TimelineSelection {
  /** Shows a role or band entry (by its element id) and presses its button. */
  select(entryId: string): void;
  /** Shows one of the readout's other panels (playback's intro and "now"); no button pressed. */
  showPanel(id: string): void;
  /** Hover and focus previews; playback turns them off while it runs. */
  setPreview(enabled: boolean): void;
  dispose(): void;
}

export interface SelectionOptions {
  /** Called before a selection the visitor made (click, tap, Enter, a link), e.g. to stop playback. */
  onUserSelect?(): void;
}

interface Item {
  button: SVGGElement;
  entry: HTMLElement;
}

export function enhanceTimeline(
  section: HTMLElement,
  options: SelectionOptions = {},
): TimelineSelection | null {
  const svg = section.querySelector<SVGSVGElement>('svg[data-timeline]');
  const readout = section.querySelector<HTMLElement>('[data-readout]');
  if (!svg || !readout) return null;

  const items: Item[] = [];
  for (const button of svg.querySelectorAll<SVGGElement>('[data-entry]')) {
    const entry = document.getElementById(button.dataset.entry!);
    if (entry && readout.contains(entry)) items.push({ button, entry });
  }
  if (!items.length) return null;
  const entries = [...readout.querySelectorAll<HTMLElement>('.entry')];

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

  let current: HTMLElement | null = null;
  let preview = true;

  /** Shows one entry of the readout; `item` is its button, if it has one. */
  const show = (entry: HTMLElement, item: Item | undefined, animate = true) => {
    if (entry === current) return;
    current = entry;
    svg.classList.toggle('has-selection', item !== undefined);
    for (const other of items) {
      const selected = other === item;
      other.button.classList.toggle('is-selected', selected);
      other.button.setAttribute('aria-pressed', String(selected));
    }
    for (const other of entries) other.hidden = other !== entry;
    if (animate && !reducedMotion.matches) {
      entry.animate(
        [
          { opacity: 0, transform: 'translateY(6px)' },
          { opacity: 1, transform: 'none' },
        ],
        { duration: 380, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)' },
      );
    }
  };
  const showItem = (item: Item, animate = true) => show(item.entry, item, animate);
  const take = (item: Item) => {
    options.onUserSelect?.();
    showItem(item);
  };

  const itemFor = (target: EventTarget | null) =>
    items.find(({ button }) => button === (target as Element | null)?.closest('[data-entry]'));

  const onClick = (event: MouseEvent) => {
    const item = itemFor(event.target);
    if (item) take(item);
  };
  const onKey = (event: KeyboardEvent) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const item = itemFor(event.target);
    if (!item) return;
    event.preventDefault();
    take(item);
  };
  // Mouse hover previews roles; touch taps arrive as clicks. The band spans the whole college
  // period, so it only responds to a click (else crossing it would keep stealing the view).
  const onOver = (event: PointerEvent) => {
    if (!preview || event.pointerType !== 'mouse') return;
    const item = itemFor(event.target);
    if (item?.button.dataset.role !== undefined) showItem(item);
  };
  const onFocus = (event: FocusEvent) => {
    if (!preview) return;
    const item = itemFor(event.target);
    if (item) showItem(item);
  };

  /** Selects the entry a `#role-…` / `#education-…` link points to, and scrolls to the chart. */
  const showHash = () => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    const item = items.find(({ entry }) => entry.id === id);
    if (!item) return;
    options.onUserSelect?.();
    showItem(item, false);
    section.scrollIntoView({ block: 'start' });
  };

  svg.addEventListener('click', onClick);
  svg.addEventListener('keydown', onKey);
  svg.addEventListener('pointerover', onOver);
  svg.addEventListener('focusin', onFocus);
  window.addEventListener('hashchange', showHash);

  const first = items.find(({ button }) => button.dataset.entry === svg.dataset.default);
  showItem(first ?? items[0]!, false);
  showHash();

  // Phones: start the scrolled frame at the selected role.
  const frame = svg.closest<HTMLElement>('.figwrap');
  const selected = items.find(({ entry }) => entry === current);
  if (frame && selected && frame.scrollWidth > frame.clientWidth) {
    const box = selected.button.getBoundingClientRect();
    frame.scrollLeft += box.left - frame.getBoundingClientRect().left - 40;
  }

  return {
    select(entryId) {
      const item = items.find(({ entry }) => entry.id === entryId);
      if (item) showItem(item);
    },
    showPanel(id) {
      const panel = entries.find((entry) => entry.id === id);
      if (panel) show(panel, undefined);
    },
    setPreview(enabled) {
      preview = enabled;
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
