// Camera framing ported from the concept's projection (references/concept, "system scene"):
// the camera orbits a target at yaw/pitch/distance, with a focal length in pixels and the
// projection centre offset within the hero (cx, cy as fractions of its size).

import type { PerspectiveCamera } from 'three';

export const PHONE_MAX_WIDTH = 760;
const INITIAL_YAW = 0.7;
/** How much of the system (as a multiple of its outer edge) the explore view keeps in the
 * available width. The concept fitted 10.6 / 7.9 units around a belt edge at 8.95. */
const FRAME_DESKTOP = 10.6 / 8.95;
const FRAME_PHONE = 7.9 / 8.95;
const MIN_DISTANCE = 12;

export interface CameraPose {
  target: readonly [number, number, number];
  yaw: number;
  pitch: number;
  distance: number;
  /** Where the target appears, as a fraction of the hero's width and height. */
  cx: number;
  cy: number;
}

/** Focal length in CSS pixels for a `width` × `height` hero. */
export function focalLength(width: number, height: number): number {
  return Math.min(height * 0.95, width * 1.35);
}

/** The resting "explore" view: whole system to the right on desktop, below the text on phones.
 * `extent` is the system's outer radius (the belt's outer edge). */
export function explorePose(width: number, height: number, extent: number): CameraPose {
  const phone = width < PHONE_MAX_WIDTH;
  const available = (phone ? 0.47 : 0.34) * width;
  const radius = extent * (phone ? FRAME_PHONE : FRAME_DESKTOP);
  return {
    target: [0, 0, 0],
    yaw: INITIAL_YAW,
    pitch: phone ? 0.62 : 0.4,
    distance: Math.max(MIN_DISTANCE, (focalLength(width, height) * radius) / available),
    cx: phone ? 0.5 : 0.64,
    cy: phone ? 0.68 : 0.56,
  };
}

/** Points `camera` according to `pose` for a `width` × `height` (CSS px) viewport. */
export function applyPose(
  camera: PerspectiveCamera,
  pose: CameraPose,
  width: number,
  height: number,
): void {
  const [tx, ty, tz] = pose.target;
  const flat = Math.cos(pose.pitch) * pose.distance;
  camera.position.set(
    tx + Math.sin(pose.yaw) * flat,
    ty + Math.sin(pose.pitch) * pose.distance,
    tz + Math.cos(pose.yaw) * flat,
  );
  camera.up.set(0, 1, 0);
  camera.lookAt(tx, ty, tz);

  camera.fov = (2 * Math.atan(height / (2 * focalLength(width, height))) * 180) / Math.PI;
  camera.aspect = width / height;
  camera.near = 0.1;
  camera.far = 500;
  // Shift the projection centre from the middle of the hero to (cx, cy).
  camera.setViewOffset(
    width,
    height,
    width * (0.5 - pose.cx),
    height * (0.5 - pose.cy),
    width,
    height,
  );
  camera.updateProjectionMatrix();
}

/**
 * The visit view: the planet large on one side, room for the panel on the other. With a
 * landing preview (desktop only) the planet moves up-left and smaller, above the screen.
 */
export function visitPose(
  planet: readonly [number, number, number],
  planetRadius: number,
  width: number,
  height: number,
  landing = false,
): CameraPose {
  const phone = width < PHONE_MAX_WIDTH;
  const land = landing && !phone;
  // Planet's on-screen radius (CSS px).
  const screenRadius = phone
    ? Math.min(0.19 * height, 0.34 * width)
    : land
      ? Math.min(0.15 * height, 0.11 * width)
      : Math.min(0.27 * height, 0.2 * width);
  return {
    target: planet,
    yaw: 0,
    pitch: 0.14,
    distance: (focalLength(width, height) * planetRadius) / screenRadius,
    cx: phone ? 0.5 : land ? 0.27 : 0.33,
    cy: phone ? 0.26 : land ? 0.27 : 0.5,
  };
}

const TAU = Math.PI * 2;

/** Signed shortest difference `a - b` between two angles, in (-π, π]. */
export function angleDelta(a: number, b: number): number {
  return ((((a - b) % TAU) + TAU * 1.5) % TAU) - Math.PI;
}

/** Yaw that shows a planet lit from the side (star off to one side), nearest the current yaw. */
export function yawFor(planet: readonly [number, number, number], currentYaw: number): number {
  const theta = Math.atan2(planet[2], planet[0]);
  const behindStar = Math.atan2(-Math.cos(theta), -Math.sin(theta));
  const a = behindStar + 0.95;
  const b = behindStar - 0.95;
  return Math.abs(angleDelta(a, currentYaw)) < Math.abs(angleDelta(b, currentYaw)) ? a : b;
}

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Camera between `from` and `to` at progress `k` (0–1): eased, with a slight lift in pitch and
 * a zoom-out arc (larger when hopping between planets), as in the concept.
 */
export function interpolatePose(
  from: CameraPose,
  to: CameraPose,
  yawTo: number,
  k: number,
  hop: boolean,
): CameraPose {
  const e = easeInOutCubic(Math.min(1, Math.max(0, k)));
  const arc = Math.sin(Math.PI * Math.min(1, k));
  return {
    target: [
      lerp(from.target[0], to.target[0], e),
      lerp(from.target[1], to.target[1], e),
      lerp(from.target[2], to.target[2], e),
    ],
    yaw: from.yaw + angleDelta(yawTo, from.yaw) * e,
    pitch: lerp(from.pitch, to.pitch, e) + 0.12 * arc,
    distance: Math.exp(
      lerp(Math.log(from.distance), Math.log(to.distance), e) + (hop ? 1.2 : 0.15) * arc,
    ),
    cx: lerp(from.cx, to.cx, e),
    cy: lerp(from.cy, to.cy, e),
  };
}
