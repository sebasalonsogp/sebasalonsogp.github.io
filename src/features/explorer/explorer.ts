// Explorer: renderer, camera, resize, render loop that pauses when the hero is off screen or
// the tab is hidden, context-loss handling and disposal; the system's bodies built from the
// page's data; HTML labels; drag to turn, hover, click to open a project, idle drift. The
// hero's `data-explorer` attribute reports the state:
// loading | running | paused | static | unavailable.

import { PerspectiveCamera, Scene, Vector3, WebGLRenderer } from 'three';
import { ambientLoop, reducedMotion } from '../motion/motion';
import { setSkyYaw } from '../sky/sky';
import { createBodies } from './bodies';
import { applyPose, explorePose, focalLength, PHONE_MAX_WIDTH } from './camera';
import { createLabels, type ScreenFrame, type ScreenPlanet } from './labels';
import { layoutSystem, type SystemData } from './system';

const MAX_DPR = 2;
const FPS = 60;
/** Planet self-rotation (radians per second). */
const SPIN_SPEED = 0.12;
/** Longest step the simulation takes per frame, so a stalled tab does not jump. */
const MAX_STEP = 0.05;
/** Slow turn of the whole system while nobody interacts (radians per second). */
const IDLE_YAW_SPEED = 0.012;
/** Drag sensitivity (radians per CSS px) and pitch limits, from the concept. */
const YAW_PER_PX = 0.0055;
const PITCH_PER_PX = 0.004;
const PITCH_MIN = 0.06;
const PITCH_MAX = 1.15;
/** Movement that turns a press into a drag rather than a click (CSS px). */
const DRAG_THRESHOLD = 5;
/** Minimum hit radius around a planet (CSS px) and extra beyond its edge. */
const HIT_MIN = 18;
const HIT_EXTRA = 10;
const BELT_LABEL_SAMPLES = 48;

function readSystem(hero: HTMLElement): SystemData {
  const source = hero.querySelector('script[data-explorer-system]')?.textContent;
  return source ? (JSON.parse(source) as SystemData) : { star: '', earlierWork: '', projects: [] };
}

export interface ExplorerController {
  dispose(): void;
}

interface Drag {
  pointer: number;
  x: number;
  y: number;
  yaw: number;
  pitch: number;
  moved: boolean;
  mouse: boolean;
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

  const data = readSystem(hero);
  const hrefs = new Map(data.projects.map((p) => [p.id, p.href]));
  const scene = new Scene();
  const camera = new PerspectiveCamera();
  const layout = layoutSystem(data.projects);
  const bodies = createBodies(layout);
  scene.add(bodies.group);
  hero.dataset.planets = String(bodies.planetCount);

  let width = 0;
  let height = 0;
  let focal = 1;
  let onScreen = true;
  let lost = false;
  let simTime = 0;
  let spin = 0;
  let last: number | undefined;
  let yaw = explorePose(1, 1, layout.extent).yaw;
  /** Set once the visitor tilts the view with a mouse drag. */
  let pitch: number | undefined;
  let drag: Drag | undefined;
  let hoverId: string | null = null;
  let externalId: string | null = null;
  let shownHighlight: string | null | undefined;
  let screen: ScreenPlanet[] = [];
  let pending = 0;

  // With reduced motion nothing animates, so changes (drag, hover, resize) draw one frame.
  const invalidate = () => {
    if (hero.dataset.explorer !== 'static' || pending) return;
    pending = requestAnimationFrame(() => {
      pending = 0;
      draw(performance.now() / 1000);
    });
  };

  const labels = createLabels(hero, data, (id) => {
    externalId = id;
    setHighlight();
  });

  const setHighlight = () => {
    const id = hoverId ?? externalId;
    if (id === shownHighlight) return;
    shownHighlight = id;
    bodies.setHighlight(id);
    labels.setHighlight(id);
    invalidate();
  };

  const resize = () => {
    width = hero.clientWidth;
    height = hero.clientHeight;
    if (!width || !height) return;
    renderer.setPixelRatio(Math.min(MAX_DPR, window.devicePixelRatio || 1));
    renderer.setSize(width, height, false);
    focal = focalLength(width, height);
    labels.measure();
  };

  // Screen projection for labels and hit testing.
  const projected = new Vector3();
  const point = new Vector3();
  const toScreen = (world: Vector3) => {
    projected.copy(world).project(camera);
    return {
      x: ((projected.x + 1) / 2) * width,
      y: ((1 - projected.y) / 2) * height,
      depth: world.distanceTo(camera.position),
      inFront: projected.z < 1,
    };
  };

  const screenFrame = (): ScreenFrame => {
    screen = bodies.planets.map((p) => {
      const s = toScreen(p.position);
      return { id: p.id, x: s.x, y: s.y, radius: (p.radius * focal) / s.depth, visible: s.inFront };
    });
    const centre = toScreen(point.set(0, 0, 0));
    const starRadius = Math.max(26, (1.1 * focal) / centre.depth);

    // Belt label: the front-most belt point to the right of the centre.
    let belt: ScreenFrame['belt'] = null;
    const r = layout.belt.outer + 0.2;
    for (let k = 0; k < BELT_LABEL_SAMPLES; k++) {
      const a = (k / BELT_LABEL_SAMPLES) * Math.PI * 2;
      const s = toScreen(point.set(Math.cos(a) * r, 0, Math.sin(a) * r));
      if (s.inFront && s.x > centre.x && (!belt || s.y > belt.y)) belt = { x: s.x, y: s.y };
    }

    return {
      width,
      height,
      centerX: centre.x,
      compact: width < PHONE_MAX_WIDTH,
      star: centre.inFront ? { x: centre.x, y: centre.y, radius: starRadius } : null,
      belt,
      planets: screen,
    };
  };

  function draw(seconds: number) {
    const step = last === undefined ? 0 : Math.min(MAX_STEP, Math.max(0, seconds - last));
    last = seconds;
    if (!reducedMotion.matches) {
      simTime += step;
      spin += step * SPIN_SPEED;
      if (!drag && !hoverId) yaw += step * IDLE_YAW_SPEED;
    }
    const pose = explorePose(width, height, layout.extent);
    applyPose(camera, { ...pose, yaw, pitch: pitch ?? pose.pitch }, width, height);
    setSkyYaw(yaw);
    bodies.update(simTime, spin, camera, { focal, dpr: renderer.getPixelRatio() });
    renderer.render(scene, camera);
    labels.update(screenFrame());
  }

  const loop = ambientLoop(draw, {
    fps: FPS,
    active: () => onScreen && !lost,
    onState: (state) => setState(lost ? 'unavailable' : state),
  });

  // Pointer interaction: drag to turn, hover to highlight, click a planet to open it.
  const local = (event: PointerEvent) => {
    const box = canvas.getBoundingClientRect();
    return [event.clientX - box.left, event.clientY - box.top] as const;
  };
  const pick = (x: number, y: number) => {
    let best: ScreenPlanet | undefined;
    let bestDistance = Infinity;
    for (const p of screen) {
      if (!p.visible) continue;
      const d = Math.hypot(x - p.x, y - p.y);
      if (d < Math.max(p.radius + HIT_EXTRA, HIT_MIN) && d < bestDistance) {
        best = p;
        bestDistance = d;
      }
    }
    return best;
  };

  const onDown = (event: PointerEvent) => {
    if (event.button !== 0) return;
    const pose = explorePose(width, height, layout.extent);
    drag = {
      pointer: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      yaw,
      pitch: pitch ?? pose.pitch,
      moved: false,
      mouse: event.pointerType === 'mouse',
    };
    canvas.setPointerCapture(event.pointerId);
  };
  const onMove = (event: PointerEvent) => {
    if (drag && event.pointerId === drag.pointer) {
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
        drag.moved = true;
        canvas.classList.add('is-dragging');
      }
      if (drag.moved) {
        yaw = drag.yaw - dx * YAW_PER_PX;
        if (drag.mouse) {
          pitch = Math.min(PITCH_MAX, Math.max(PITCH_MIN, drag.pitch + dy * PITCH_PER_PX));
        }
        invalidate();
      }
      return;
    }
    const id = pick(...local(event))?.id ?? null;
    if (id !== hoverId) {
      hoverId = id;
      canvas.classList.toggle('is-over-planet', Boolean(id));
      setHighlight();
    }
  };
  const onUp = (event: PointerEvent) => {
    if (!drag || event.pointerId !== drag.pointer) return;
    const wasClick = !drag.moved;
    drag = undefined;
    canvas.classList.remove('is-dragging');
    if (wasClick && event.type === 'pointerup') {
      const target = pick(...local(event));
      const href = target && hrefs.get(target.id);
      if (href) window.location.assign(href);
    }
  };
  const onLeave = () => {
    if (drag) return;
    hoverId = null;
    canvas.classList.remove('is-over-planet');
    setHighlight();
  };
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
  canvas.addEventListener('pointerleave', onLeave);

  // Hovering or focusing a project row highlights its planet.
  const rows = [...document.querySelectorAll<HTMLElement>('[data-project-row]')];
  const onRowEnter = (event: Event) => {
    externalId = (event.currentTarget as HTMLElement).dataset.projectRow ?? null;
    setHighlight();
  };
  const onRowLeave = () => {
    externalId = null;
    setHighlight();
  };
  for (const row of rows) {
    row.addEventListener('pointerenter', onRowEnter);
    row.addEventListener('pointerleave', onRowLeave);
    row.addEventListener('focusin', onRowEnter);
    row.addEventListener('focusout', onRowLeave);
  }

  const visibility = new IntersectionObserver(([entry]) => {
    onScreen = entry?.isIntersecting ?? false;
    loop.kick();
  });
  visibility.observe(hero);

  const size = new ResizeObserver(() => {
    resize();
    invalidate();
  });
  size.observe(hero);
  void document.fonts.ready.then(() => {
    labels.measure();
    invalidate();
  });

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
      cancelAnimationFrame(pending);
      visibility.disconnect();
      size.disconnect();
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('pointerleave', onLeave);
      for (const row of rows) {
        row.removeEventListener('pointerenter', onRowEnter);
        row.removeEventListener('pointerleave', onRowLeave);
        row.removeEventListener('focusin', onRowEnter);
        row.removeEventListener('focusout', onRowLeave);
      }
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      labels.dispose();
      bodies.dispose();
      scene.clear();
      renderer.dispose();
      canvas.remove();
      setSkyYaw(0);
      delete hero.dataset.explorer;
      delete hero.dataset.planets;
    },
  };
}
