// Three.js objects for the system: star, orbits, planets (procedural surfaces), rings, moons
// and the outer belt, all built from a SystemLayout.

import {
  BufferGeometry,
  CanvasTexture,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineLoop,
  Mesh,
  Points,
  RingGeometry,
  ShaderMaterial,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  Vector3,
  type PerspectiveCamera,
} from 'three';
import { mulberry32 } from '../sky/stars';
import {
  beltFragment,
  beltVertex,
  DOMAIN_INDEX,
  MOON_DOMAIN,
  planetFragment,
  planetVertex,
  RIM,
  ringFragment,
  ringVertex,
} from './shaders';
import { moonOffset, type PlanetLayout, type SystemLayout } from './system';

const SOL = [255, 194, 122] as const;
/** Star core: --sol lifted 45% toward white (concept's solCore). */
const SOL_CORE = SOL.map((c) => Math.round(c + (255 - c) * 0.45));
const DIM = '#9297A8';
/** --dim as sRGB components for shaders that write colour straight out. */
const DIM_SRGB = [0x92 / 255, 0x97 / 255, 0xa8 / 255];
const STAR_RADIUS = 1.1;
const STAR_MIN_RADIUS_PX = 26;
const STAR_HALO = 3.4;
const ORBIT_OPACITY = 0.22;
const ORBIT_SEGMENTS = 160;
const BELT_COUNT = 340;
const BELT_SEED = 99;
const BELT_ALPHA = 0.55;
const MOON_SCALE = 0.17;
const SPIN_STEP = 1.3;

export interface ViewMetrics {
  /** Focal length in CSS pixels. */
  focal: number;
  dpr: number;
}

export interface Bodies {
  group: Group;
  planetCount: number;
  /** Positions everything for simulation time `t` and accumulated spin `spin` (radians). */
  update(t: number, spin: number, camera: PerspectiveCamera, view: ViewMetrics): void;
  dispose(): void;
}

function starTexture(): CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const c = size / 2;
  const sol = SOL.join(',');
  const halo = ctx.createRadialGradient(c, c, 0, c, c, c);
  halo.addColorStop(0, `rgba(${sol},0.13)`);
  halo.addColorStop(1, `rgba(${sol},0)`);
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, size, size);
  const core = ctx.createRadialGradient(c, c, 0, c, c, c / STAR_HALO);
  core.addColorStop(0, 'rgba(255,250,240,1)');
  core.addColorStop(0.18, `rgba(${SOL_CORE.join(',')},0.95)`);
  core.addColorStop(0.45, `rgba(${sol},0.35)`);
  core.addColorStop(1, `rgba(${sol},0)`);
  ctx.fillStyle = core;
  ctx.fillRect(0, 0, size, size);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

function circle(radius: number): BufferGeometry {
  const points: number[] = [];
  for (let k = 0; k < ORBIT_SEGMENTS; k++) {
    const a = (k / ORBIT_SEGMENTS) * Math.PI * 2;
    points.push(Math.cos(a) * radius, 0, Math.sin(a) * radius);
  }
  return new BufferGeometry().setAttribute('position', new Float32BufferAttribute(points, 3));
}

function beltGeometry(layout: SystemLayout['belt']): BufferGeometry {
  const rnd = mulberry32(BELT_SEED);
  const positions: number[] = [];
  const sizes: number[] = [];
  const alphas: number[] = [];
  for (let i = 0; i < BELT_COUNT; i++) {
    const r = layout.inner + rnd() * (layout.outer - layout.inner);
    const a = rnd() * Math.PI * 2;
    const y = (rnd() - 0.5) * 0.22;
    const s = 0.5 + rnd();
    positions.push(Math.cos(a) * r, y, Math.sin(a) * r);
    sizes.push(s);
    alphas.push(BELT_ALPHA * (0.45 + (0.55 * s) / 1.5));
  }
  return new BufferGeometry()
    .setAttribute('position', new Float32BufferAttribute(positions, 3))
    .setAttribute('aSize', new Float32BufferAttribute(sizes, 1))
    .setAttribute('aAlpha', new Float32BufferAttribute(alphas, 1));
}

function surfaceMaterial(domain: number, seed: number, rim: readonly number[]): ShaderMaterial {
  return new ShaderMaterial({
    vertexShader: planetVertex,
    fragmentShader: planetFragment,
    defines: { DOMAIN: domain },
    uniforms: {
      uSeed: { value: seed },
      uSpin: { value: 0 },
      uLight: { value: new Vector3(1, 0, 0) },
      uRim: { value: rim },
    },
  });
}

export function createBodies(layout: SystemLayout): Bodies {
  const group = new Group();
  const geometries: BufferGeometry[] = [];
  const materials: (ShaderMaterial | LineBasicMaterial | SpriteMaterial)[] = [];
  const keep = <T extends BufferGeometry>(g: T) => (geometries.push(g), g);
  const use = <T extends ShaderMaterial | LineBasicMaterial | SpriteMaterial>(m: T) => (
    materials.push(m),
    m
  );

  // Star.
  const texture = starTexture();
  const star = new Sprite(
    use(new SpriteMaterial({ map: texture, transparent: true, depthWrite: false })),
  );
  group.add(star);

  // Orbits.
  const orbitMaterial = use(
    new LineBasicMaterial({ color: new Color(DIM), transparent: true, opacity: ORBIT_OPACITY }),
  );
  orbitMaterial.depthWrite = false;
  for (const planet of layout.planets)
    group.add(new LineLoop(keep(circle(planet.orbit)), orbitMaterial));

  // Belt.
  const beltMaterial = use(
    new ShaderMaterial({
      vertexShader: beltVertex,
      fragmentShader: beltFragment,
      uniforms: {
        uFocal: { value: 1 },
        uMinSize: { value: 0.8 },
        uColor: { value: DIM_SRGB },
      },
      transparent: true,
      depthWrite: false,
    }),
  );
  const belt = new Points(keep(beltGeometry(layout.belt)), beltMaterial);
  group.add(belt);

  // Planets, rings and moons.
  const sphere = keep(new SphereGeometry(1, 64, 32));
  const moonSphere = keep(new SphereGeometry(1, 24, 12));
  const ringGeometry = keep(new RingGeometry(1.42, 2.25, 160, 1));
  const ringMaterial = use(
    new ShaderMaterial({
      vertexShader: ringVertex,
      fragmentShader: ringFragment,
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
    }),
  );

  interface PlanetView {
    layout: PlanetLayout;
    mesh: Mesh<SphereGeometry, ShaderMaterial>;
    ring?: Mesh;
    moons: Mesh<SphereGeometry, ShaderMaterial>[];
  }

  const planets: PlanetView[] = layout.planets.map((planet, i) => {
    const mesh = new Mesh(
      sphere,
      use(surfaceMaterial(DOMAIN_INDEX[planet.domain], planet.seed, RIM[planet.domain])),
    );
    mesh.scale.setScalar(planet.radius);
    mesh.userData = { spinOffset: i * SPIN_STEP };
    group.add(mesh);

    let ring: Mesh | undefined;
    if (planet.ring) {
      ring = new Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = -Math.PI / 2;
      ring.scale.setScalar(planet.radius);
      group.add(ring);
    }

    const moonMaterial = use(surfaceMaterial(MOON_DOMAIN, 0, [0, 0, 0, 0]));
    const moons = Array.from({ length: planet.moons }, () => {
      const moon = new Mesh(moonSphere, moonMaterial.clone());
      materials.push(moon.material);
      moon.scale.setScalar(planet.radius * MOON_SCALE);
      group.add(moon);
      return moon;
    });

    return { layout: planet, mesh, ...(ring ? { ring } : {}), moons };
  });

  const light = new Vector3();
  const toStar = (position: Vector3, camera: PerspectiveCamera) =>
    light.copy(position).negate().transformDirection(camera.matrixWorldInverse);

  return {
    group,
    planetCount: planets.length,
    update(t, spin, camera, view) {
      camera.updateMatrixWorld();

      const depth = camera.position.length();
      const pxPerUnit = view.focal / depth;
      const starRadius = Math.max(STAR_RADIUS, STAR_MIN_RADIUS_PX / pxPerUnit);
      star.scale.setScalar(starRadius * STAR_HALO * 2);

      belt.rotation.y = -t * layout.belt.speed;
      beltMaterial.uniforms.uFocal!.value = view.focal * view.dpr;
      // WebGL may skip points under a pixel, so the belt's smallest grains are 1 CSS px.
      beltMaterial.uniforms.uMinSize!.value = view.dpr;

      for (const { layout: p, mesh, ring, moons } of planets) {
        const a = p.phase + p.speed * t;
        mesh.position.set(Math.cos(a) * p.orbit, 0, Math.sin(a) * p.orbit);
        ring?.position.copy(mesh.position);
        mesh.material.uniforms.uSpin!.value = (mesh.userData.spinOffset as number) + spin;
        (mesh.material.uniforms.uLight!.value as Vector3).copy(toStar(mesh.position, camera));
        moons.forEach((moon, i) => {
          const [x, y, z] = moonOffset(p, i, t);
          moon.position.set(mesh.position.x + x, y, mesh.position.z + z);
          (moon.material.uniforms.uLight!.value as Vector3).copy(toStar(moon.position, camera));
        });
      }
    },
    dispose() {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      texture.dispose();
      group.clear();
    },
  };
}
