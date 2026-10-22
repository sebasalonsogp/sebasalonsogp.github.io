// Timeline playback (docs/design-spec.md, "Experience timeline"): "Play the timeline" moves a
// cursor from just before the first role to each role's start in turn (0.9–2.6 s per
// segment, instant with reduced motion), drawing the roles as it passes with a dot riding
// each live bar, and shows each role's details for 4.6 s. Then it sweeps to now and the
// light cone returns. Stop, Escape, any selection or scrolling the chart away stops it.

import { reducedMotion } from '../motion/motion';
import type { TimelineSelection } from './selection';

const MS_PER_YEAR = 1500;
const MIN_SWEEP_MS = 900;
const MAX_SWEEP_MS = 2600;
const DWELL_MS = 4600;
/** The cursor starts this long before the first role (years). */
const LEAD = 0.3;
/** Past this x (viewBox units) the month label sits left of the cursor. */
const LABEL_FLIP_X = 840;
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export interface Playback {
  stop(): void;
  dispose(): void;
}

interface Track {
  group: SVGGElement;
  bar: SVGLineElement;
  head: SVGCircleElement;
  entryId: string;
  t0: number;
  t1: number;
  x1: string;
}

/** A running playback; `cancel` ends whatever it is waiting on. */
interface Run {
  cancel: () => void;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const easeInOutSine = (k: number) => -(Math.cos(Math.PI * k) - 1) / 2;

export function createPlayback(
  section: HTMLElement,
  selection: TimelineSelection,
): Playback | null {
  const svg = section.querySelector<SVGSVGElement>('svg[data-timeline]');
  const controls = section.querySelector<HTMLElement>('[data-timeline-controls]');
  const button = section.querySelector<HTMLButtonElement>('[data-play]');
  const bar = section.querySelector<HTMLElement>('[data-play-bar]');
  const label = section.querySelector<HTMLElement>('[data-play-label]');
  const fill = section.querySelector<HTMLElement>('[data-play-fill]');
  const cursor = svg?.querySelector<SVGGElement>('.cursor');
  const cursorText = cursor?.querySelector('text');
  if (!svg || !controls || !button || !bar || !label || !fill || !cursor || !cursorText) {
    return null;
  }

  const left = Number(svg.dataset.left);
  const start = Number(svg.dataset.start);
  const scale = Number(svg.dataset.scale);
  const now = Number(svg.dataset.now);
  const x = (t: number) => left + (t - start) * scale;
  const frame = svg.closest<HTMLElement>('.figwrap');

  const tracks: Track[] = [...svg.querySelectorAll<SVGGElement>('[data-role]')]
    .map((group) => ({
      group,
      bar: group.querySelector<SVGLineElement>('.bar')!,
      head: group.querySelector<SVGCircleElement>('.head')!,
      entryId: group.dataset.entry!,
      t0: Number(group.dataset.t0),
      t1: Number(group.dataset.t1),
      x1: group.querySelector('.bar')!.getAttribute('x2')!,
    }))
    .sort((a, b) => a.t0 - b.t0);
  if (!tracks.length) return null;

  controls.hidden = false;

  let run: Run | null = null;

  const setCursor = (t: number) => {
    const cx = x(t);
    cursor.setAttribute('transform', `translate(${cx.toFixed(2)},0)`);
    const flip = cx > LABEL_FLIP_X;
    cursorText.setAttribute('text-anchor', flip ? 'end' : 'start');
    cursorText.setAttribute('x', flip ? '-9' : '9');
    const year = Math.floor(t + 1e-6);
    const month = clamp(Math.floor((t - year) * 12 + 1e-6), 0, 11);
    cursorText.textContent = `${MONTHS[month]} ${year}`;
    for (const track of tracks) {
      const started = t >= track.t0 - 1e-6;
      track.group.classList.toggle('is-future', !started);
      track.group.classList.toggle('is-live', started && t <= track.t1 + 1e-6);
      const end = x(clamp(t, track.t0, track.t1)).toFixed(2);
      track.bar.setAttribute('x2', end);
      track.head.setAttribute('cx', end);
    }
    // Phones: keep the cursor a little right of the frame's middle.
    if (frame && frame.scrollWidth > frame.clientWidth + 4) {
      const width = svg.getBoundingClientRect().width;
      frame.scrollLeft = (cx / svg.viewBox.baseVal.width) * width - frame.clientWidth * 0.55;
    }
  };

  const resetBars = () => {
    for (const track of tracks) {
      track.group.classList.remove('is-future', 'is-live');
      track.bar.setAttribute('x2', track.x1);
      track.head.setAttribute('cx', track.x1);
    }
  };

  /** Eases the cursor from `a` to `b`; resolves when done or cancelled. */
  const sweep = (a: number, b: number, current: Run) =>
    new Promise<void>((resolve) => {
      const duration = reducedMotion.matches
        ? 0
        : clamp(Math.abs(b - a) * MS_PER_YEAR, MIN_SWEEP_MS, MAX_SWEEP_MS);
      const began = performance.now();
      let frameId = 0;
      current.cancel = () => {
        cancelAnimationFrame(frameId);
        resolve();
      };
      const tick = (time: number) => {
        if (run !== current) return resolve();
        const k = duration ? Math.min(1, (time - began) / duration) : 1;
        setCursor(a + (b - a) * easeInOutSine(k));
        if (k < 1) frameId = requestAnimationFrame(tick);
        else resolve();
      };
      frameId = requestAnimationFrame(tick);
    });

  /** Waits `ms` while the progress bar fills. */
  const dwell = (ms: number, current: Run) =>
    new Promise<void>((resolve) => {
      fill.classList.remove('is-running');
      void fill.offsetWidth;
      fill.style.animationDuration = `${ms}ms`;
      fill.classList.add('is-running');
      const timer = window.setTimeout(resolve, ms);
      current.cancel = () => {
        window.clearTimeout(timer);
        resolve();
      };
    });

  const finish = () => {
    run = null;
    svg.classList.remove('is-playing');
    resetBars();
    bar.hidden = true;
    fill.classList.remove('is-running');
    selection.setPreview(true);
  };

  const play = async () => {
    const current: Run = { cancel: () => {} };
    run = current;
    button.textContent = 'Stop';
    bar.hidden = false;
    label.textContent = '';
    svg.classList.add('is-playing');
    selection.setPreview(false);
    // Keep controls, chart and details on one screen.
    const top = controls.getBoundingClientRect().top;
    if (top < 0 || top > window.innerHeight * 0.35) {
      controls.scrollIntoView({
        block: 'start',
        behavior: reducedMotion.matches ? 'auto' : 'smooth',
      });
    }

    let t = tracks[0]!.t0 - LEAD;
    setCursor(t);
    selection.showPanel('timeline-intro');
    for (const [i, track] of tracks.entries()) {
      label.textContent = `Role ${i + 1} of ${tracks.length}`;
      await sweep(t, track.t0, current);
      if (run !== current) return;
      t = track.t0;
      selection.select(track.entryId);
      await dwell(DWELL_MS, current);
      if (run !== current) return;
    }
    label.textContent = 'Now';
    await sweep(t, now, current);
    if (run !== current) return;
    finish();
    selection.showPanel('timeline-now');
    button.textContent = 'Play again';
  };

  const stop = () => {
    if (!run) return;
    const current = run;
    run = null;
    current.cancel();
    finish();
    button.textContent = 'Play the timeline';
  };

  const onButton = () => {
    if (run) stop();
    else void play();
  };
  const onKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && run) stop();
  };
  // Scrolling the chart out of view stops playback rather than running unseen.
  const visibility = new IntersectionObserver(([entry]) => {
    if (entry && !entry.isIntersecting) stop();
  });

  button.addEventListener('click', onButton);
  document.addEventListener('keydown', onKey);
  visibility.observe(svg);

  return {
    stop,
    dispose() {
      stop();
      button.removeEventListener('click', onButton);
      document.removeEventListener('keydown', onKey);
      visibility.disconnect();
    },
  };
}
