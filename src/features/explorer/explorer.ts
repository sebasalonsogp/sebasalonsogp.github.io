// Explorer scene shell (Phase 3.1): renderer, camera, resize, render loop that pauses when
// the hero is off screen or the tab is hidden, context-loss handling and disposal. Bodies
// (star, planets, orbits) arrive in 3.2. The hero's `data-explorer` attribute reports the
// state: loading | running | paused | static | unavailable.

import { PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { ambientLoop } from '../motion/motion';
import { applyPose, explorePose } from './camera';

const MAX_DPR = 2;
const FPS = 60;

export interface ExplorerController {
  dispose(): void;
}

export function mountExplorer(hero: HTMLElement): ExplorerController | null {
  const setState = (state: string) => {
    hero.dataset.explorer = state;
  };

  const canvas = document.createElement('canvas');
  canvas.className = 'system';
  canvas.setAttribute('aria-hidden', 'true');

  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
  } catch {
    setState('unavailable');
    return null;
  }
  renderer.setClearColor(0x000000, 0);
  hero.prepend(canvas);

  const scene = new Scene();
  const camera = new PerspectiveCamera();
  let onScreen = true;
  let lost = false;

  const resize = () => {
    const width = hero.clientWidth;
    const height = hero.clientHeight;
    if (!width || !height) return;
    renderer.setPixelRatio(Math.min(MAX_DPR, window.devicePixelRatio || 1));
    renderer.setSize(width, height, false);
    applyPose(camera, explorePose(width, height), width, height);
  };

  const draw = () => renderer.render(scene, camera);

  const loop = ambientLoop(draw, {
    fps: FPS,
    active: () => onScreen && !lost,
    onState: (state) => setState(lost ? 'unavailable' : state),
  });

  const visibility = new IntersectionObserver(([entry]) => {
    onScreen = entry?.isIntersecting ?? false;
    loop.kick();
  });
  visibility.observe(hero);

  const size = new ResizeObserver(() => {
    resize();
    if (hero.dataset.explorer === 'static') draw();
  });
  size.observe(hero);

  // On context loss stop rendering; Three.js rebuilds its resources when it is restored.
  const onLost = (event: Event) => {
    event.preventDefault();
    lost = true;
    loop.kick();
    setState('unavailable');
  };
  const onRestored = () => {
    lost = false;
    resize();
    loop.kick();
  };
  canvas.addEventListener('webglcontextlost', onLost);
  canvas.addEventListener('webglcontextrestored', onRestored);

  resize();
  loop.kick();

  return {
    dispose() {
      loop.dispose();
      visibility.disconnect();
      size.disconnect();
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      scene.clear();
      renderer.dispose();
      canvas.remove();
      delete hero.dataset.explorer;
    },
  };
}
