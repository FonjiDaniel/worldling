import { BufferAttribute, BufferGeometry, type Object3D } from "three";

import { between, seededRandom } from "@convex/shared/random";

// Orbit layout for moons and fireflies, seeded so the same world always has the same sky.

export const FIREFLY_COUNT = 40;

export interface MoonOrbit {
  radius: number;
  phase: number;
  inclination: number;
  size: number;
  /** Multiplier on the base 90s orbit; the outer moon is slower. */
  speed: number;
}

export function moonOrbits(seed: number): [MoonOrbit, MoonOrbit] {
  const random = seededRandom(seed ^ 0x6d6f6f6e);
  const orbit = (radius: number, speed: number): MoonOrbit => ({
    radius,
    phase: between(random, 0, Math.PI * 2),
    inclination: between(random, -0.35, 0.35),
    size: between(random, 0.1, 0.16),
    speed,
  });
  return [orbit(1.6, 1), orbit(1.95, 0.7)];
}

/** Places a moon on its orbit. Mutates the object, allocates nothing (safe in useFrame). */
export function placeMoon(target: Object3D, orbit: MoonOrbit, angle: number): void {
  const a = orbit.phase + angle * orbit.speed;
  const x = Math.cos(a) * orbit.radius;
  const z = Math.sin(a) * orbit.radius;
  target.position.set(x, z * Math.sin(orbit.inclination), z * Math.cos(orbit.inclination));
}

export function createFireflyGeometry(seed: number): BufferGeometry {
  const random = seededRandom(seed ^ 0x66697265);
  const positions = new Float32Array(FIREFLY_COUNT * 3);
  const orbits = new Float32Array(FIREFLY_COUNT * 4);
  for (let i = 0; i < FIREFLY_COUNT; i += 1) {
    orbits.set(
      [
        between(random, 1.12, 1.32),
        between(random, 0, Math.PI * 2),
        between(random, -1.2, 1.2),
        between(random, 0.04, 0.12),
      ],
      i * 4,
    );
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("aOrbit", new BufferAttribute(orbits, 4));
  // Positions are computed in the vertex shader, so bounds come from the orbit radius.
  geometry.computeBoundingSphere();
  if (geometry.boundingSphere) geometry.boundingSphere.radius = 1.4;
  return geometry;
}
