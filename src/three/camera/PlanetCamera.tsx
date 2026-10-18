"use client";

import { PerspectiveCamera } from "@react-three/drei";

// Near orthographic, about 25 degrees above the equator (05 art direction). A narrow field of
// view from far away flattens perspective without losing the sphere's volume.

const FOV_DEG = 16;
const ELEVATION_RAD = (25 * Math.PI) / 180;

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
