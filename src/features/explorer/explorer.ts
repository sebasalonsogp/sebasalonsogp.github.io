// Explorer: renderer, camera, resize, render loop that pauses when the hero is off screen or
// the tab is hidden, context-loss handling and disposal, plus the system's bodies built from
// the page's data. The hero's `data-explorer` attribute reports the state:
// loading | running | paused | static | unavailable.

import { PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { ambientLoop, reducedMotion } from '../motion/motion';
import { createBodies } from './bodies';
import { applyPose, explorePose, focalLength } from './camera';
import { layoutSystem, type SystemProject } from './system';

const MAX_DPR = 2;
const FPS = 60;
/** Planet self-rotation (radians per second). */
const SPIN_SPEED = 0.12;
/** Longest step the simulation takes per frame, so a stalled tab does not jump. */
const MAX_STEP = 0.05;

function readSystem(hero: HTMLElement): SystemProject[] {
  const source = hero.querySelector('script[data-explorer-system]')?.textContent;
  return source ? (JSON.parse(source) as SystemProject[]) : [];
}

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
  const layout = layoutSystem(readSystem(hero));
  const bodies = createBodies(layout);
  scene.add(bodies.group);
  hero.dataset.planets = String(bodies.planetCount);

  let onScreen = true;
  let lost = false;
  let focal = 1;
  let simTime = 0;
  let spin = 0;
  let last: number | undefined;

  const resize = () => {
    const width = hero.clientWidth;
    const height = hero.clientHeight;
    if (!width || !height) return;
    renderer.setPixelRatio(Math.min(MAX_DPR, window.devicePixelRatio || 1));
    renderer.setSize(width, height, false);
    applyPose(camera, explorePose(width, height, layout.extent), width, height);
    focal = focalLength(width, height);
  };

  const draw = (seconds: number) => {
    const step = last === undefined ? 0 : Math.min(MAX_STEP, Math.max(0, seconds - last));
    last = seconds;
    if (!reducedMotion.matches) {
      simTime += step;
      spin += step * SPIN_SPEED;
    }
    bodies.update(simTime, spin, camera, { focal, dpr: renderer.getPixelRatio() });
    renderer.render(scene, camera);
  };

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
    if (hero.dataset.explorer === 'static') draw(performance.now() / 1000);
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
    last = undefined;
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
      bodies.dispose();
      scene.clear();
      renderer.dispose();
      canvas.remove();
      delete hero.dataset.explorer;
      delete hero.dataset.planets;
    },
  };
}
