// Camera framing ported from the concept's projection (references/concept, "system scene"):
// the camera orbits a target at yaw/pitch/distance, with a focal length in pixels and the
// projection centre offset within the hero (cx, cy as fractions of its size).

import type { PerspectiveCamera } from 'three';

export const PHONE_MAX_WIDTH = 760;
const INITIAL_YAW = 0.7;
/** Radius (scene units) the explore view keeps on screen: outer orbit plus the belt. */
const SYSTEM_RADIUS_DESKTOP = 10.6;
const SYSTEM_RADIUS_PHONE = 7.9;
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

/** The resting "explore" view: whole system to the right on desktop, below the text on phones. */
export function explorePose(width: number, height: number): CameraPose {
  const phone = width < PHONE_MAX_WIDTH;
  const available = (phone ? 0.47 : 0.34) * width;
  const radius = phone ? SYSTEM_RADIUS_PHONE : SYSTEM_RADIUS_DESKTOP;
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
