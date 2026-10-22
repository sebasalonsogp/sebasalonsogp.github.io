// Explorer: renderer, camera, resize, render loop that pauses when the hero is off screen or
// the tab is hidden, context-loss handling and disposal; the system's bodies built from the
// page's data; HTML labels; drag to turn, hover, idle drift; and visits (Phase 4.1):
// explore → flying → visit → returning, with an in-page visit panel.
// The hero reports `data-explorer` (loading | running | paused | static | unavailable) and
// `data-mode` (explore | flying | visit | returning).

import { PerspectiveCamera, Scene, Vector3, WebGLRenderer } from 'three';
import { ambientLoop, reducedMotion } from '../motion/motion';
import { setSkyYaw } from '../sky/sky';
import { createBodies } from './bodies';
import {
  applyPose,
  explorePose,
  focalLength,
  interpolatePose,
  PHONE_MAX_WIDTH,
  visitPose,
  yawFor,
  type CameraPose,
} from './camera';
import { createLabels, type ScreenFrame, type ScreenPlanet } from './labels';
import { createVisitPanel } from './panel';
import { layoutSystem, type SystemData } from './system';

const MAX_DPR = 2;
const FPS = 60;
/** Planet self-rotation (radians per second). */
const SPIN_SPEED = 0.12;
/** Longest step the simulation takes per frame, so a stalled tab does not jump. */
const MAX_STEP = 0.05;
/** Slow turn of the whole system while nobody interacts (radians per second). */
const IDLE_YAW_SPEED = 0.012;
/** How fast orbital motion eases to a stop during a visit and back afterwards (per second). */
const TIME_EASE = 3;
/** Camera transitions (ms), from the design spec. */
const FLY_MS = 1900;
const HOP_MS = 2300;
const RETURN_MS = 1500;
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
/** Delay before visiting from the project list, while the page scrolls up to the hero. */
const SCROLL_SETTLE_MS = 500;

type Mode = 'explore' | 'flying' | 'visit' | 'returning';

interface Transition {
  kind: 'planet' | 'explore';
  from: CameraPose;
  yawTo: number;
  start: number;
  duration: number;
  hop: boolean;
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

function readSystem(hero: HTMLElement): SystemData {
  const source = hero.querySelector('script[data-explorer-system]')?.textContent;
  return source ? (JSON.parse(source) as SystemData) : { star: '', earlierWork: '', projects: [] };
}

/** A plain left click, not one meant to open the link in a new tab or window. */
const isPlainClick = (event: MouseEvent) =>
  event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;

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

  const data = readSystem(hero);
  const projects = data.projects;
  const indexOf = new Map(projects.map((p, i) => [p.id, i]));
  const scene = new Scene();
  const camera = new PerspectiveCamera();
  const layout = layoutSystem(projects);
  const bodies = createBodies(layout);
  scene.add(bodies.group);
  hero.dataset.planets = String(bodies.planetCount);

  let width = 0;
  let height = 0;
  let focal = 1;
  let onScreen = true;
  let lost = false;
  let simTime = 0;
  let timeScale = 1;
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

  let mode: Mode = 'explore';
  let current: string | null = null;
  let transition: Transition | null = null;
  let returnTo: HTMLElement | null = null;
  let cam: CameraPose = explorePose(1, 1, layout.extent);

  const setMode = (next: Mode) => {
    mode = next;
    hero.dataset.mode = next;
  };
  setMode('explore');

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
    const id = mode === 'explore' ? (hoverId ?? externalId) : current;
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

  // Camera poses for the current moment.
  const planetAt = (id: string) => bodies.planets[indexOf.get(id) ?? 0]!;
  const explorePoseNow = (): CameraPose => {
    const pose = explorePose(width, height, layout.extent);
    return { ...pose, yaw, pitch: pitch ?? pose.pitch };
  };
  const visitPoseNow = (id: string): CameraPose => {
    const planet = planetAt(id);
    const { x, y, z } = planet.position;
    return { ...visitPose([x, y, z], planet.radius, width, height), yaw };
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
      const visiting = mode === 'flying' || mode === 'visit';
      timeScale += ((visiting ? 0 : 1) - timeScale) * (1 - Math.exp(-step * TIME_EASE));
      simTime += step * timeScale;
      spin += step * SPIN_SPEED;
      if (mode === 'explore' && !drag && !hoverId) yaw += step * IDLE_YAW_SPEED;
    }
    bodies.place(simTime, spin);

    if (transition) {
      const t = transition;
      const k = t.duration ? (performance.now() - t.start) / t.duration : 1;
      const to = t.kind === 'planet' && current ? visitPoseNow(current) : explorePoseNow();
      cam = interpolatePose(t.from, to, t.yawTo, k, t.hop);
      if (k >= 1) {
        transition = null;
        yaw = t.yawTo;
        setMode(t.kind === 'planet' ? 'visit' : 'explore');
        setHighlight();
      }
    } else {
      cam = mode === 'visit' && current ? visitPoseNow(current) : explorePoseNow();
    }

    applyPose(camera, cam, width, height);
    setSkyYaw(cam.yaw);
    bodies.updateView(camera, { focal, dpr: renderer.getPixelRatio() });
    renderer.render(scene, camera);
    const frame = screenFrame();
    // Labels follow the camera back while returning, so focus can return to one immediately.
    if (mode === 'explore' || mode === 'returning') labels.update(frame);
  }

  const loop = ambientLoop(draw, {
    fps: FPS,
    active: () => onScreen && !lost,
    onState: (state) => setState(lost ? 'unavailable' : state),
  });

  // Visits.
  const panel = createVisitPanel(hero, {
    onBack: () => back(),
    onStep: (direction) => step(direction),
  });

  const startTransition = (kind: Transition['kind'], id?: string) => {
    const hop = kind === 'planet' && (mode === 'visit' || mode === 'flying') && current !== id;
    const yawTo = kind === 'planet' && id ? yawFor(visitPoseNow(id).target, cam.yaw) : cam.yaw;
    transition = {
      kind,
      from: { ...cam, target: [...cam.target] as [number, number, number] },
      yawTo,
      start: performance.now(),
      duration: reducedMotion.matches ? 0 : hop ? HOP_MS : kind === 'planet' ? FLY_MS : RETURN_MS,
      hop,
    };
    setMode(kind === 'planet' ? 'flying' : 'returning');
    invalidate();
  };

  const visit = (id: string, options: { returnTo?: HTMLElement | null; focus?: boolean } = {}) => {
    const project = projects[indexOf.get(id) ?? -1];
    if (!project) return;
    if (mode === 'explore' || mode === 'returning') {
      returnTo = options.returnTo ?? (document.activeElement as HTMLElement | null);
    }
    startTransition('planet', id);
    current = id;
    hoverId = null;
    canvas.classList.remove('is-over-planet');
    labels.setVisible(false);
    bodies.setVisiting(true);
    setHighlight();
    hero.classList.add('is-visiting');
    panel.show(project, (indexOf.get(id) ?? 0) + 1, projects.length);
    if (options.focus !== false) panel.focusTitle();
  };

  function back() {
    if (mode !== 'visit' && mode !== 'flying') return;
    startTransition('explore');
    current = null;
    labels.setVisible(true);
    bodies.setVisiting(false);
    setHighlight();
    hero.classList.remove('is-visiting');
    panel.hide();
    const target = returnTo;
    returnTo = null;
    if (target?.isConnected && target !== document.body) target.focus({ preventScroll: true });
  }

  function step(direction: 1 | -1) {
    if (!current) return;
    const i = indexOf.get(current) ?? 0;
    visit(projects[(i + direction + projects.length) % projects.length]!.id);
  }

  const onKey = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || (mode !== 'visit' && mode !== 'flying')) return;
    event.preventDefault();
    back();
  };
  document.addEventListener('keydown', onKey);

  // Planet labels and project rows open the visit in place; modified clicks keep the link.
  const onLabelClick = (event: MouseEvent) => {
    const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('.planet-label');
    if (!link?.dataset.project || !isPlainClick(event)) return;
    event.preventDefault();
    visit(link.dataset.project, { returnTo: link });
  };
  hero.addEventListener('click', onLabelClick);

  let scrollTimer = 0;
  const rows = [...document.querySelectorAll<HTMLElement>('[data-project-row]')];
  const onRowClick = (event: MouseEvent) => {
    const row = event.currentTarget as HTMLElement;
    const id = row.dataset.projectRow;
    if (!id || !isPlainClick(event)) return;
    event.preventDefault();
    const link = row.querySelector<HTMLElement>('a');
    const offset = hero.getBoundingClientRect().top;
    const far = Math.abs(offset) > 60;
    if (far) {
      window.scrollTo({
        top: window.scrollY + offset,
        behavior: reducedMotion.matches ? 'auto' : 'smooth',
      });
    }
    window.clearTimeout(scrollTimer);
    scrollTimer = window.setTimeout(
      () => visit(id, { returnTo: link }),
      far && !reducedMotion.matches ? SCROLL_SETTLE_MS : 0,
    );
  };

  // Pointer interaction: drag to turn, hover to highlight, click a planet to visit it.
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
    drag = {
      pointer: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      yaw,
      pitch: pitch ?? explorePose(width, height, layout.extent).pitch,
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
      if (drag.moved && !transition) {
        yaw = drag.yaw - dx * YAW_PER_PX;
        if (drag.mouse && mode === 'explore') {
          pitch = Math.min(PITCH_MAX, Math.max(PITCH_MIN, drag.pitch + dy * PITCH_PER_PX));
        }
        invalidate();
      }
      return;
    }
    const id = pick(...local(event))?.id ?? null;
    canvas.classList.toggle('is-over-planet', Boolean(id) && id !== current);
    if (mode === 'explore' && id !== hoverId) {
      hoverId = id;
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
      if (target && target.id !== current) visit(target.id);
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
    row.addEventListener('click', onRowClick);
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
  cam = explorePoseNow();
  loop.kick();

  return {
    dispose() {
      loop.dispose();
      cancelAnimationFrame(pending);
      window.clearTimeout(scrollTimer);
      visibility.disconnect();
      size.disconnect();
      document.removeEventListener('keydown', onKey);
      hero.removeEventListener('click', onLabelClick);
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
        row.removeEventListener('click', onRowClick);
      }
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      panel.dispose();
      labels.dispose();
      bodies.dispose();
      scene.clear();
      renderer.dispose();
      canvas.remove();
      setSkyYaw(0);
      hero.classList.remove('is-visiting');
      delete hero.dataset.explorer;
      delete hero.dataset.planets;
      delete hero.dataset.mode;
    },
  };
}
