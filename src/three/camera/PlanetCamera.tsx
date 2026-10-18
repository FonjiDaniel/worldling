"use client";

import { PerspectiveCamera } from "@react-three/drei";
import { PerspectiveCamera as Camera } from "three";

import { unlocksFor } from "@convex/shared/bloom";

// Near orthographic, about 25 degrees above the equator (05 art direction). A narrow field of
// view from far away flattens perspective without losing the sphere's volume.

const FOV_DEG = 16;
const ELEVATION_RAD = (25 * Math.PI) / 180;
/** Thumbnails turn the camera a little, for a three-quarter view (SPEC §8.7). */
const THUMBNAIL_AZIMUTH_RAD = (35 * Math.PI) / 180;
const PLANET_FRAME = 1.2;
const MOON_FRAME = 2.1;

/** World radius to frame: room for moons once a level brings them. */
export function frameRadius(level: number): number {
  return unlocksFor(level).moons > 0 ? MOON_FRAME : PLANET_FRAME;
}

/** Distance that fits a sphere of `radius` in the view's shorter side. */
export function fitDistance(radius: number): number {
  return radius / Math.sin(((FOV_DEG / 2) * Math.PI) / 180);
}

export function PlanetCamera({ radius = 1.2 }: { radius?: number }) {
  const distance = fitDistance(radius);
  return (
    <PerspectiveCamera
      makeDefault
      fov={FOV_DEG}
      near={0.1}
      far={distance * 3}
      position={[0, distance * Math.sin(ELEVATION_RAD), distance * Math.cos(ELEVATION_RAD)]}
      onUpdate={(camera) => {
        camera.lookAt(0, 0, 0);
      }}
    />
  );
}

/** A fixed square camera for thumbnails, the same lens as PlanetCamera. */
export function thumbnailCamera(radius: number): Camera {
  const distance = fitDistance(radius);
  const camera = new Camera(FOV_DEG, 1, 0.1, distance * 3);
  const ground = distance * Math.cos(ELEVATION_RAD);
  camera.position.set(
    ground * Math.sin(THUMBNAIL_AZIMUTH_RAD),
    distance * Math.sin(ELEVATION_RAD),
    ground * Math.cos(THUMBNAIL_AZIMUTH_RAD),
  );
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
  return camera;
}
