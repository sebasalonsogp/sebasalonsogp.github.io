// Shared motion policy (docs/design-spec.md, "Motion and accessibility rules"):
// honor prefers-reduced-motion, pause in hidden tabs, cap ambient loops at 30 fps.

const query = window.matchMedia('(prefers-reduced-motion: reduce)');

export const reducedMotion = {
  get matches(): boolean {
    return query.matches;
  },
  /** Calls `listener` whenever the preference changes; returns an unsubscribe function. */
  subscribe(listener: (reduced: boolean) => void): () => void {
    const onChange = (event: MediaQueryListEvent) => listener(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  },
};

export const AMBIENT_FPS = 30;

export type LoopState = 'running' | 'paused' | 'static';

export interface LoopOptions {
  /** Frame cap; ambient loops use 30, the explorer 60. */
  fps?: number;
  /** Extra condition, e.g. "the hero is on screen". Call `kick()` when it changes. */
  active?: () => boolean;
  /** Draw single frames as with reduced motion, e.g. on a software renderer. */
  still?: () => boolean;
  /** Reports changes between running, paused (hidden or inactive) and static (reduced motion). */
  onState?: (state: LoopState) => void;
}

export interface AmbientLoop {
  /** Re-evaluates the conditions: starts the loop, pauses it, or draws one static frame. */
  kick(): void;
  dispose(): void;
}

/**
 * Runs `draw(seconds)` at most `fps` times per second while the tab is visible, `active()`
 * holds and motion is allowed. With reduced motion it draws a single frame and stops; while
 * hidden or inactive it draws nothing. It resumes on its own when the tab becomes visible or
 * the preference changes.
 */
export function ambientLoop(
  draw: (seconds: number) => void,
  { fps = AMBIENT_FPS, active = () => true, still = () => false, onState }: LoopOptions = {},
): AmbientLoop {
  const interval = 1000 / fps;
  let frame = 0;
  let last = -Infinity;
  let state: LoopState | undefined;

  const evaluate = (): LoopState =>
    document.hidden || !active()
      ? 'paused'
      : reducedMotion.matches || still()
        ? 'static'
        : 'running';

  const report = (next: LoopState) => {
    if (next !== state) onState?.((state = next));
  };

  const tick = (now: number) => {
    const next = evaluate();
    if (next !== 'running') {
      frame = 0;
      report(next);
      if (next === 'static') draw(now / 1000);
      return;
    }
    frame = requestAnimationFrame(tick);
    if (now - last < interval - 1) return;
    last = now;
    draw(now / 1000);
  };

  const kick = () => {
    const next = evaluate();
    report(next);
    if (next === 'running') {
      if (!frame) frame = requestAnimationFrame(tick);
      return;
    }
    cancelAnimationFrame(frame);
    frame = 0;
    if (next === 'static') draw(performance.now() / 1000);
  };

  const unsubscribe = reducedMotion.subscribe(kick);
  document.addEventListener('visibilitychange', kick);

  return {
    kick,
    dispose() {
      cancelAnimationFrame(frame);
      frame = 0;
      unsubscribe();
      document.removeEventListener('visibilitychange', kick);
    },
  };
}
