// HTML labels over the explorer canvas (docs/design-spec.md, "Hero and explorer"). Planet
// labels are links to the project pages, so the system is usable with a keyboard and a screen
// reader; the star and belt labels are decorative. Placement follows the concept: beside the
// planet, flipped to stay on screen, nudged down to avoid other labels.

import { formatMonth } from '../../lib/format';
import type { SystemData } from './system';

/** Gap between a planet's edge and its label (CSS px). */
const GAP = 10;
const EDGE = 8;
/** Extra radius of the highlight ring around a planet (CSS px). */
const RING_GAP = 7;
const MAX_NUDGES = 6;

export interface ScreenPlanet {
  id: string;
  x: number;
  y: number;
  /** Planet radius on screen (CSS px). */
  radius: number;
  visible: boolean;
}

export interface ScreenFrame {
  width: number;
  height: number;
  /** Screen x of the system's centre; planets left of it get labels on their left. */
  centerX: number;
  /** Phones show the name only. */
  compact: boolean;
  star: { x: number; y: number; radius: number } | null;
  belt: { x: number; y: number } | null;
  planets: ScreenPlanet[];
}

export interface Labels {
  update(frame: ScreenFrame): void;
  setHighlight(id: string | null): void;
  /** Re-measures label sizes (after fonts load or the layout changes). */
  measure(): void;
  dispose(): void;
}

export function createLabels(
  hero: HTMLElement,
  data: SystemData,
  onHover: (id: string | null) => void,
): Labels {
  const layer = document.createElement('div');
  layer.className = 'explorer-labels';

  const star = document.createElement('div');
  star.className = 'star-label';
  star.setAttribute('aria-hidden', 'true');
  star.textContent = data.star;

  const belt = document.createElement('div');
  belt.className = 'belt-label';
  belt.setAttribute('aria-hidden', 'true');
  belt.textContent = data.earlierWork;

  const ring = document.createElement('div');
  ring.className = 'highlight-ring';
  ring.setAttribute('aria-hidden', 'true');

  const planets = new Map(
    data.projects.map((project) => {
      const link = document.createElement('a');
      link.className = 'planet-label';
      link.href = project.href;
      link.dataset.project = project.id;
      const name = document.createElement('span');
      name.className = 'name';
      name.textContent = project.short;
      const meta = document.createElement('span');
      meta.className = 'meta';
      meta.textContent = formatMonth(project.lastCommit) + (project.live ? ' · live' : '');
      link.append(name, meta);
      return [project.id, { link, width: 0, height: 0 }];
    }),
  );

  layer.append(ring, star, belt, ...[...planets.values()].map((p) => p.link));
  // After the intro in the DOM, so keyboard order is heading, intro, then the system; the intro
  // stays on top visually through its higher z-index.
  hero.append(layer);

  const enter = (event: Event) =>
    onHover((event.currentTarget as HTMLElement).dataset.project ?? null);
  const leave = () => onHover(null);
  for (const { link } of planets.values()) {
    link.addEventListener('pointerenter', enter);
    link.addEventListener('pointerleave', leave);
    link.addEventListener('focus', enter);
    link.addEventListener('blur', leave);
  }

  let highlight: string | null = null;
  let compact: boolean | undefined;
  let beltWidth = 0;

  const measure = () => {
    for (const label of planets.values()) {
      label.width = label.link.offsetWidth;
      label.height = label.link.offsetHeight;
    }
    // Hidden elements measure 0, so show the belt label for a moment to size it.
    const wasHidden = belt.hidden;
    belt.hidden = false;
    beltWidth = belt.offsetWidth;
    belt.hidden = wasHidden;
  };

  const place = (el: HTMLElement, x: number, y: number) => {
    el.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
  };

  return {
    measure,
    setHighlight(id) {
      highlight = id;
      for (const [key, { link }] of planets) link.classList.toggle('is-highlighted', key === id);
    },
    update(frame) {
      if (frame.compact !== compact) {
        compact = frame.compact;
        layer.classList.toggle('is-compact', compact);
        measure();
      }

      const placed: [number, number, number, number][] = [];
      const order = [...frame.planets].sort((a, b) => a.y - b.y);
      for (const p of order) {
        const label = planets.get(p.id);
        if (!label) continue;
        label.link.hidden = !p.visible;
        if (!p.visible) continue;

        let left = p.x < frame.centerX - 4;
        if (!left && p.x + p.radius + GAP + label.width > frame.width - EDGE) left = true;
        if (left && p.x - p.radius - GAP - label.width < EDGE) left = false;
        const x = left ? p.x - p.radius - GAP - label.width : p.x + p.radius + GAP;
        let top = p.y - label.height / 2;
        for (let tries = 0; tries < MAX_NUDGES; tries++) {
          const hit = placed.find(
            ([x0, y0, x1, y1]) =>
              x < x1 && x + label.width > x0 && top < y1 && top + label.height > y0,
          );
          if (!hit) break;
          top = hit[3] + 1;
        }
        placed.push([x, top, x + label.width, top + label.height]);
        label.link.classList.toggle('is-left', left);
        place(label.link, x, top);
      }

      star.hidden = !frame.star;
      if (frame.star) place(star, frame.star.x, frame.star.y + frame.star.radius * 0.55 + 4);

      // Beside the front of the belt, kept on screen horizontally; hidden when the belt's front
      // is too close to the bottom of the hero (concept's rule).
      const beltFits = frame.belt && frame.belt.y < frame.height - 70;
      belt.hidden = !data.earlierWork || !beltFits;
      if (frame.belt && beltFits) {
        place(belt, Math.min(frame.belt.x + 6, frame.width - EDGE - beltWidth), frame.belt.y + 2);
      }

      const target = highlight
        ? frame.planets.find((p) => p.id === highlight && p.visible)
        : undefined;
      ring.hidden = !target;
      if (target) {
        const size = 2 * (target.radius + RING_GAP);
        ring.style.width = ring.style.height = `${size}px`;
        place(ring, target.x - size / 2, target.y - size / 2);
      }
    },
    dispose() {
      for (const { link } of planets.values()) {
        link.removeEventListener('pointerenter', enter);
        link.removeEventListener('pointerleave', leave);
        link.removeEventListener('focus', enter);
        link.removeEventListener('blur', leave);
      }
      layer.remove();
    },
  };
}
