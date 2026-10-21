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

export interface AmbientLoop {
  /** Starts the loop if it may run, or draws one static frame if it may not. */
  kick(): void;
  dispose(): void;
}

/**
 * Runs `draw(seconds)` at most `fps` times per second while the tab is visible and motion is
 * allowed. With reduced motion it draws a single frame and stops; it resumes on its own when
 * the tab becomes visible or the preference changes.
 */
export function ambientLoop(draw: (seconds: number) => void, fps = AMBIENT_FPS): AmbientLoop {
  const interval = 1000 / fps;
  let frame = 0;
  let last = -Infinity;

  const canRun = () => !document.hidden && !reducedMotion.matches;

  const tick = (now: number) => {
    if (!canRun()) {
      frame = 0;
      return;
    }
    frame = requestAnimationFrame(tick);
    if (now - last < interval - 1) return;
    last = now;
    draw(now / 1000);
  };

  const kick = () => {
    if (canRun()) {
      if (!frame) frame = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(frame);
      frame = 0;
      draw(performance.now() / 1000);
    }
  };

  const unsubscribe = reducedMotion.subscribe(kick);
  const onVisibility = () => {
    if (!document.hidden) kick();
  };
  document.addEventListener('visibilitychange', onVisibility);

  return {
    kick,
    dispose() {
      cancelAnimationFrame(frame);
      frame = 0;
      unsubscribe();
      document.removeEventListener('visibilitychange', onVisibility);
    },
  };
}
