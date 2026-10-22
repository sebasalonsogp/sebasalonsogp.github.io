// The black hole behind Contact (docs/design-spec.md, "Contact"): one full-screen triangle in
// raw WebGL running the lensing shader. It draws at up to 25 fps while on screen (the shared
// ambient loop pauses it in hidden tabs and draws one frame with reduced motion). The first
// frames are timed on the GPU: the resolution steps down while they are over budget, and a
// GPU that is still too slow at the lowest resolution (or a software renderer) gets one still
// frame instead of an animation. The page shows the figure laid out but invisible
// (`data-pending`) while it mounts; the first frame reveals it. Without WebGL, if the shader
// fails (mount returns null) or the context is lost, the figure is hidden: no backdrop.

import { isSoftwareRenderer } from '../gpu';
import { ambientLoop, type LoopState } from '../motion/motion';
import { DISK_INNER, DISK_OUTER, FRAGMENT, VERTEX } from './shader';

const FPS = 25;
const MAX_PIXEL_RATIO = 1.75;
/** Resolution scale: starts at 1, steps down by STEP while frames are slow, never below MIN. */
const MIN_QUALITY = 0.5;
const QUALITY_STEP = 0.78;
/** GPU time per frame (ms) the backdrop may take; above it the resolution steps down. */
const BUDGET_MS = 20;
/** Still above this at the lowest resolution: stop animating and keep one frame. */
const GIVE_UP_MS = 40;
/** One frame this slow skips straight to a still frame at the lowest resolution. */
const HOPELESS_MS = 160;
/** Frames timed per resolution; their median decides. */
const PROBES = 3;
/** Disk time: starts at 6 (a settled-looking disk) and turns at half speed. */
const TIME_OFFSET = 6;
const TIME_SCALE = 0.5;

export interface BlackHole {
  dispose(): void;
}

interface Program {
  resolution: WebGLUniformLocation | null;
  time: WebGLUniformLocation | null;
}

function compile(gl: WebGLRenderingContext): Program | null {
  const shader = (type: number, source: string) => {
    const s = gl.createShader(type);
    if (!s) return null;
    gl.shaderSource(s, source);
    gl.compileShader(s);
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
  };
  const vertex = shader(gl.VERTEX_SHADER, VERTEX);
  const fragment = shader(gl.FRAGMENT_SHADER, FRAGMENT);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);

  // One triangle that covers the viewport.
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'p');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  gl.uniform3f(gl.getUniformLocation(program, 'C0'), ...DISK_OUTER);
  gl.uniform3f(gl.getUniformLocation(program, 'C1'), ...DISK_INNER);
  gl.clearColor(0, 0, 0, 0);
  return {
    resolution: gl.getUniformLocation(program, 'R'),
    time: gl.getUniformLocation(program, 'T'),
  };
}

export function mountBlackHole(figure: HTMLElement): BlackHole | null {
  const canvas = figure.querySelector('canvas');
  const gl = canvas?.getContext('webgl', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
  });
  if (!canvas || !gl) return null;
  let program = compile(gl);
  if (!program) return null;

  // Software renderers get a still frame without being timed.
  const software = isSoftwareRenderer(gl);
  let quality = software ? MIN_QUALITY : 1;
  /** One still frame instead of an animation (slow GPU or software renderer). */
  let still = software;
  let tuning = !software;
  let samples: number[] = [];
  let onScreen = false;
  let lost = false;
  let started: number | null = null;
  const pixel = new Uint8Array(4);

  const setState = (state: LoopState | 'unavailable') => {
    figure.dataset.state = state;
  };

  const size = () => {
    const box = canvas.getBoundingClientRect();
    const ratio = Math.min(MAX_PIXEL_RATIO, window.devicePixelRatio || 1) * quality;
    canvas.width = Math.max(2, Math.round(box.width * ratio));
    canvas.height = Math.max(2, Math.round(box.height * ratio));
    gl.viewport(0, 0, canvas.width, canvas.height);
    figure.dataset.quality = quality.toFixed(2);
  };

  const render = (time: number) => {
    if (!program || lost) return;
    gl.uniform2f(program.resolution, canvas.width, canvas.height);
    gl.uniform1f(program.time, time);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    delete figure.dataset.pending;
  };
  const renderStill = () => render(TIME_OFFSET);

  const settle = () => {
    still = true;
    tuning = false;
    quality = MIN_QUALITY;
    size();
    renderStill();
    loop.kick();
  };

  /** Times one frame on the GPU (reading a pixel waits for it) and adapts to the result. */
  const tune = (time: number) => {
    const began = performance.now();
    render(time);
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
    const ms = performance.now() - began;
    if (ms > HOPELESS_MS) return settle();
    samples.push(ms);
    if (samples.length < PROBES) return;
    const median = samples.sort((a, b) => a - b)[Math.floor(PROBES / 2)]!;
    samples = [];
    if (median <= BUDGET_MS) {
      tuning = false;
    } else if (quality > MIN_QUALITY) {
      quality = Math.max(MIN_QUALITY, quality * QUALITY_STEP);
      size();
    } else if (median > GIVE_UP_MS) {
      settle();
    } else {
      tuning = false;
    }
  };

  const draw = (seconds: number) => {
    started ??= seconds;
    if (figure.dataset.state === 'static') return renderStill();
    const time = (seconds - started) * TIME_SCALE + TIME_OFFSET;
    if (tuning) tune(time);
    else render(time);
  };

  const loop = ambientLoop(draw, {
    fps: FPS,
    active: () => onScreen && !lost && !still,
    onState: (state) => setState(lost ? 'unavailable' : still ? 'static' : state),
  });

  const resize = new ResizeObserver(() => {
    size();
    if (still) renderStill();
    else if (onScreen) draw(performance.now() / 1000);
  });
  const visibility = new IntersectionObserver(
    ([entry]) => {
      onScreen = entry?.isIntersecting ?? false;
      if (onScreen && still && figure.dataset.pending !== undefined) renderStill();
      loop.kick();
    },
    { rootMargin: '120px' },
  );

  const onLost = (event: Event) => {
    event.preventDefault();
    lost = true;
    figure.hidden = true;
    loop.kick();
    setState('unavailable');
  };
  const onRestored = () => {
    program = compile(gl);
    lost = program === null;
    if (lost) return;
    figure.dataset.pending = '';
    figure.hidden = false;
    size();
    if (still) renderStill();
    loop.kick();
  };

  size();
  canvas.addEventListener('webglcontextlost', onLost);
  canvas.addEventListener('webglcontextrestored', onRestored);
  resize.observe(canvas);
  visibility.observe(canvas);

  return {
    dispose() {
      loop.dispose();
      resize.disconnect();
      visibility.disconnect();
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
