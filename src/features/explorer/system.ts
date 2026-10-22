// Solar-system layout from content (docs/design-spec.md, "Hero and explorer"). Pure data: the
// same projects always give the same system, and adding or removing a project needs no
// scene-code change.

export type Domain = 'backend' | 'ml' | 'data' | 'math';

/** Everything the page hands the explorer (embedded as JSON in the hero). */
export interface SystemData {
  /** Star label, e.g. "Sebastian". */
  star: string;
  /** Home page URL (with the site base) and document title; project titles add the name. */
  homeHref: string;
  homeTitle: string;
  siteName: string;
  /** Belt label, e.g. "Earlier work · 2023–25"; empty when there is no earlier work. */
  earlierWork: string;
  projects: SystemProject[];
}

/** A preview for the landing screen and lightbox, already optimized at build time. */
export type SystemMedia =
  | {
      type: 'image';
      src: string;
      srcset: string;
      width: number;
      height: number;
      alt: string;
      caption: string;
      fit: 'cover' | 'contain';
    }
  | { type: 'video'; src: string; poster: string; caption: string };

/** A project as the explorer sees it, in orbit order (most recent commit first). */
export interface SystemProject {
  id: string;
  /** The project's page (`/projects/<id>/`, with the site base). */
  href: string;
  short: string;
  title: string;
  summary: string;
  /** Plain-language write-up and engineering log for the visit panel. */
  brief: string;
  log: string;
  tech: string[];
  demoUrl?: string;
  repoUrl: string;
  domain: Domain;
  lastCommit: string;
  loc: number;
  live: boolean;
  subsystems: string[];
  media: SystemMedia[];
}

export interface PlanetLayout {
  id: string;
  domain: Domain;
  /** Orbit radius (scene units). */
  orbit: number;
  /** Planet radius (scene units). */
  radius: number;
  /** Angle at simulation time 0 (radians). */
  phase: number;
  /** Orbital angular speed (radians per second). */
  speed: number;
  /** Surface noise seed, stable per project id. */
  seed: number;
  ring: boolean;
  moons: number;
}

export interface SystemLayout {
  planets: PlanetLayout[];
  belt: { inner: number; outer: number; speed: number };
  /** Outer edge of the system; the camera frames to it. */
  extent: number;
}

const FIRST_ORBIT = 2.3;
const ORBIT_STEP = 1.15;
const FIRST_PHASE = 2.2;
const GOLDEN_ANGLE = 2.399963;
/** Angular speed at radius 1; Kepler's third law gives ω ∝ r^-1.5. */
const ORBIT_SPEED = 0.32;
const PLANET_SCALE = 0.17;
const MIN_PLANET_SIZE = 0.25;
const BELT_GAP = 1.2;
const BELT_WIDTH = 0.85;

/** Planet size factor from lines of code, on a log scale (spec: 0.6 + 0.45·log10(loc/1000)). */
export function planetSize(loc: number): number {
  return Math.max(MIN_PLANET_SIZE, 0.6 + 0.45 * Math.log10(loc / 1000));
}

/** FNV-1a hash of the project id, reduced to a small positive seed. */
export function seedFor(id: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 0x01000193);
  return (h >>> 0) % 1000;
}

const keplerSpeed = (radius: number) => ORBIT_SPEED * Math.pow(radius, -1.5);

export function layoutSystem(projects: readonly SystemProject[]): SystemLayout {
  const planets = projects.map((project, i): PlanetLayout => {
    const orbit = FIRST_ORBIT + i * ORBIT_STEP;
    return {
      id: project.id,
      domain: project.domain,
      orbit,
      radius: PLANET_SCALE * planetSize(project.loc),
      phase: (FIRST_PHASE + i * GOLDEN_ANGLE) % (Math.PI * 2),
      speed: keplerSpeed(orbit),
      seed: seedFor(project.id),
      ring: project.live,
      moons: project.subsystems.length,
    };
  });
  const lastOrbit = planets.at(-1)?.orbit ?? FIRST_ORBIT;
  const inner = lastOrbit + BELT_GAP;
  const outer = inner + BELT_WIDTH;
  return {
    planets,
    belt: { inner, outer, speed: keplerSpeed((inner + outer) / 2) },
    extent: outer,
  };
}

/** Moon offset from its planet at simulation time `t` (concept's moon orbit). */
export function moonOffset(
  planet: PlanetLayout,
  index: number,
  t: number,
): [number, number, number] {
  const distance = planet.radius * (2.7 + index);
  const a = t * (0.5 / (1 + index)) + index * 2.1 + planet.seed;
  return [Math.cos(a) * distance, Math.sin(a * 0.7) * distance * 0.12, Math.sin(a) * distance];
}
