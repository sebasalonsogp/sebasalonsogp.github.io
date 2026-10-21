// 2D canvas sky behind the whole page (docs/design-spec.md, "Sky"). Two canvases: a static
// layer (haze + faint stars) painted once, and a star layer where only the small squares
// around bright stars are repainted each frame so they twinkle. Parallax moves both with a
// CSS transform, which costs no repaint.

import { ambientLoop, reducedMotion } from '../motion/motion';
import {
  generateStars,
  kelvinToRgb,
  TEMPERATURE_BUCKETS,
  twinkle,
  type BrightStar,
  type StarField,
} from './stars';

const SEED = 7;
/** Extra sky around the viewport so parallax never shows an edge (CSS px; matches Sky.astro). */
const MARGIN = 60;
const MAX_DPR = 1.5;
const HAZE_STRENGTH = 0.024;
const HAZE_COLORS = ['#9AA6CC', '#B3A8D6'] as const;
const YAW_PARALLAX_PX = 40;
const SCROLL_PARALLAX = 0.03;
const SCROLL_PARALLAX_MAX_PX = 55;
/** Largest twinkle scale (1 + 0.22 × envelope × scintillation) bounds each star's square. */
const MAX_SCALE = 1.25;

export interface SkyController {
  /** Explorer yaw in radians; shifts the sky horizontally (±40 px). Phase 3 calls this. */
  setYaw(yaw: number): void;
  dispose(): void;
}

function sprite(rgb: [number, number, number]): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  const color = rgb.join(',');
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.1, `rgba(${color},0.95)`);
  g.addColorStop(0.28, `rgba(${color},0.32)`);
  g.addColorStop(0.6, `rgba(${color},0.07)`);
  g.addColorStop(1, `rgba(${color},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return canvas;
}

function hexToRgb(hex: string): string {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(',');
}

function paintStatic(ctx: CanvasRenderingContext2D, field: StarField, dpr: number) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, field.width, field.height);
  for (const blob of field.haze) {
    const color = hexToRgb(HAZE_COLORS[blob.tint]);
    const g = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.radius);
    g.addColorStop(0, `rgba(${color},${HAZE_STRENGTH})`);
    g.addColorStop(1, `rgba(${color},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(blob.x - blob.radius, blob.y - blob.radius, blob.radius * 2, blob.radius * 2);
  }
  const colors = TEMPERATURE_BUCKETS.map((t) => kelvinToRgb(t).join(','));
  for (const star of field.dim) {
    ctx.fillStyle = `rgba(${colors[star.bucket]},${star.alpha.toFixed(3)})`;
    ctx.fillRect(star.x, star.y, star.size, star.size);
  }
}

export function mountSky(root: HTMLElement): SkyController {
  const layer = root.querySelector<HTMLElement>('[data-sky-layer]');
  const staticCanvas = root.querySelector<HTMLCanvasElement>('[data-sky-static]');
  const starCanvas = root.querySelector<HTMLCanvasElement>('[data-sky-stars]');
  const staticCtx = staticCanvas?.getContext('2d');
  const starCtx = starCanvas?.getContext('2d');
  if (!layer || !staticCanvas || !starCanvas || !staticCtx || !starCtx) {
    return { setYaw() {}, dispose() {} };
  }

  const sprites = TEMPERATURE_BUCKETS.map((t) => sprite(kelvinToRgb(t)));
  let field: StarField;
  let dpr = 1;
  let builtWidth = 0;
  let builtHeight = 0;
  let yaw = 0;
  let lastTransform = '';

  /** Device-pixel square a star can cover at its largest. */
  const bounds = (star: BrightStar) => {
    const half = Math.ceil((star.size * MAX_SCALE * dpr) / 2) + 1;
    return [Math.floor(star.x * dpr) - half, Math.floor(star.y * dpr) - half, half * 2] as const;
  };

  const build = () => {
    dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
    builtWidth = root.clientWidth;
    builtHeight = root.clientHeight;
    field = generateStars(builtWidth + MARGIN * 2, builtHeight + MARGIN * 2, SEED);
    for (const canvas of [staticCanvas, starCanvas]) {
      canvas.width = Math.round(field.width * dpr);
      canvas.height = Math.round(field.height * dpr);
    }
    paintStatic(staticCtx, field, dpr);
    starCtx.setTransform(1, 0, 0, 1, 0, 0);
    starCtx.clearRect(0, 0, starCanvas.width, starCanvas.height);
  };

  const place = (still: boolean) => {
    const x = still ? 0 : Math.sin(yaw) * YAW_PARALLAX_PX;
    const y = still ? 0 : -Math.min(window.scrollY * SCROLL_PARALLAX, SCROLL_PARALLAX_MAX_PX);
    const transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    if (transform !== lastTransform) layer.style.transform = lastTransform = transform;
  };

  const draw = (t: number) => {
    const still = reducedMotion.matches;
    root.dataset.motion = still ? 'static' : 'animated';
    place(still);

    starCtx.setTransform(1, 0, 0, 1, 0, 0);
    // Clear every star's square first, then draw them all, so overlapping glows stay intact.
    for (const star of field.bright) {
      const [x, y, size] = bounds(star);
      starCtx.clearRect(x, y, size, size);
    }
    starCtx.globalCompositeOperation = 'lighter';
    for (const star of field.bright) {
      const { brightness, scale } = still ? { brightness: star.base, scale: 1 } : twinkle(star, t);
      const w = star.size * scale * dpr;
      starCtx.globalAlpha = brightness;
      starCtx.drawImage(sprites[star.bucket]!, star.x * dpr - w / 2, star.y * dpr - w / 2, w, w);
    }
    starCtx.globalAlpha = 1;
    starCtx.globalCompositeOperation = 'source-over';
  };

  build();
  const loop = ambientLoop(draw);
  loop.kick();

  // Rebuild only when the sky really changes size; it is sized to the large viewport, so
  // phone toolbars appearing and disappearing do not regenerate the stars.
  let resizeTimer = 0;
  const onResize = () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (root.clientWidth === builtWidth && root.clientHeight === builtHeight) return;
      build();
      draw(performance.now() / 1000);
    }, 150);
  };
  window.addEventListener('resize', onResize);

  return {
    setYaw(next) {
      yaw = next;
    },
    dispose() {
      loop.dispose();
      window.clearTimeout(resizeTimer);
      window.removeEventListener('resize', onResize);
    },
  };
}
