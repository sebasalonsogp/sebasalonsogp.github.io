// Seeded star field (docs/design-spec.md, "Sky"). Pure data: no DOM, so the same seed and size
// always give the same sky.

const TAU = Math.PI * 2;

export const STAR_DENSITY_PX2 = 520;
export const MIN_STARS = 600;
export const MAX_STARS = 3400;
/** Stars brighter than this magnitude are drawn as twinkling sprites; the rest are static. */
export const TWINKLE_MAGNITUDE = 4.1;
const FAINTEST_MAGNITUDE = 6.5;
/** Fraction of stars placed in the Milky Way band. */
const BAND_SHARE = 0.38;

/** Colour temperatures used for star sprites (kelvin). */
export const TEMPERATURE_BUCKETS = [3300, 3900, 4500, 5200, 5900, 6700, 8000, 10500, 15000];

export interface HazeBlob {
  x: number;
  y: number;
  radius: number;
  /** 0 or 1: which of the two haze colours. */
  tint: 0 | 1;
}

export interface DimStar {
  x: number;
  y: number;
  bucket: number;
  alpha: number;
  size: number;
}

export interface BrightStar {
  x: number;
  y: number;
  bucket: number;
  size: number;
  base: number;
  /** Scintillation amplitude; larger toward the bottom of the sky (the horizon). */
  amp: number;
  f1: number;
  f2: number;
  p1: number;
  p2: number;
  /** Slow envelope frequency and phase. */
  ef: number;
  ep: number;
}

export interface StarField {
  width: number;
  height: number;
  haze: HazeBlob[];
  dim: DimStar[];
  bright: BrightStar[];
}

/** Mulberry32: small, fast, seedable PRNG returning [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Approximate blackbody colour, lifted toward white so faint stars stay readable. */
export function kelvinToRgb(kelvin: number): [number, number, number] {
  const t = kelvin / 100;
  let r: number, g: number, b: number;
  if (t <= 66) {
    r = 255;
    g = 99.47 * Math.log(t) - 161.12;
    b = t <= 19 ? 0 : 138.52 * Math.log(t - 10) - 305.04;
  } else {
    r = 329.7 * Math.pow(t - 60, -0.1332);
    g = 288.12 * Math.pow(t - 60, -0.0755);
    b = 255;
  }
  const lift = 0.38;
  return [r, g, b].map((c) => Math.round(clamp(c, 0, 255) * (1 - lift) + 255 * lift)) as [
    number,
    number,
    number,
  ];
}

function nearestBucket(kelvin: number): number {
  let best = 0;
  TEMPERATURE_BUCKETS.forEach((t, i) => {
    if (Math.abs(t - kelvin) < Math.abs(TEMPERATURE_BUCKETS[best]! - kelvin)) best = i;
  });
  return best;
}

/** Generates a star field for a `width` × `height` CSS-pixel area. */
export function generateStars(width: number, height: number, seed: number): StarField {
  const rnd = mulberry32(seed);
  const count = clamp(Math.round((width * height) / STAR_DENSITY_PX2), MIN_STARS, MAX_STARS);
  const k = Math.pow(10, 0.45 * FAINTEST_MAGNITUDE) - 1;

  // Milky Way: a diagonal band from lower left to upper right.
  const bx0 = 0;
  const by0 = height * 0.86;
  const bx1 = width;
  const by1 = height * 0.08;
  const bandWidth = Math.min(width, height) * 0.09;

  const haze: HazeBlob[] = [];
  for (let i = 0; i < 26; i++) {
    const t = i / 25;
    haze.push({
      x: lerp(bx0, bx1, t),
      y: lerp(by0, by1, t),
      radius: Math.min(width, height) * (0.12 + 0.1 * rnd()),
      tint: i % 3 === 0 ? 1 : 0,
    });
  }

  const dim: DimStar[] = [];
  const bright: BrightStar[] = [];
  for (let i = 0; i < count; i++) {
    // Magnitudes follow the real distribution: many faint stars, few bright ones.
    let magnitude = Math.log10(1 + rnd() * k) / 0.45;
    let x: number;
    let y: number;
    if (rnd() < BAND_SHARE) {
      const t = rnd();
      const offset = (rnd() + rnd() + rnd() - 1.5) * bandWidth;
      x = lerp(bx0, bx1, t) + offset * 0.45;
      y = lerp(by0, by1, t) + offset;
      magnitude = Math.min(FAINTEST_MAGNITUDE, magnitude + 0.7);
    } else {
      x = rnd() * width;
      y = rnd() * height;
    }

    const u = rnd();
    const kelvin =
      u < 0.12
        ? 9000 + rnd() * 9000
        : u < 0.42
          ? 5600 + rnd() * 1800
          : u < 0.88
            ? 3900 + rnd() * 1400
            : 3100 + rnd() * 700;
    const bucket = nearestBucket(kelvin);
    const flux = Math.pow(10, -0.4 * magnitude);

    if (magnitude < TWINKLE_MAGNITUDE) {
      bright.push({
        x,
        y,
        bucket,
        size:
          3.2 + 19 * Math.sqrt(flux) + (3.5 * (TWINKLE_MAGNITUDE - magnitude)) / TWINKLE_MAGNITUDE,
        base: clamp(0.34 + 0.72 * Math.pow(flux, 0.25), 0.34, 1),
        amp: (0.45 + 0.55 * rnd()) * (0.75 + 0.6 * (y / height)),
        f1: 1.6 + rnd() * 2.2,
        f2: 3.6 + rnd() * 3.4,
        p1: rnd() * TAU,
        p2: rnd() * TAU,
        ef: 0.12 + rnd() * 0.3,
        ep: rnd() * TAU,
      });
    } else {
      dim.push({
        x,
        y,
        bucket,
        alpha: 0.2 + 0.55 * clamp((5.9 - magnitude) / 2.2, 0, 1),
        size: magnitude < 4.8 ? 1.35 : 1,
      });
    }
  }

  return { width, height, haze, dim, bright };
}

/** Brightness and size multiplier of a bright star at time `t` (seconds): two-frequency
 * scintillation under a slow envelope. */
export function twinkle(star: BrightStar, t: number): { brightness: number; scale: number } {
  const envelope = Math.pow(0.5 + 0.5 * Math.sin(t * star.ef + star.ep), 2);
  const scint = 0.6 * Math.sin(t * star.f1 + star.p1) + 0.4 * Math.sin(t * star.f2 + star.p2);
  return {
    brightness: clamp(star.base * (1 + star.amp * (0.35 + envelope) * scint), 0.05, 1),
    scale: 1 + 0.22 * envelope * scint,
  };
}
