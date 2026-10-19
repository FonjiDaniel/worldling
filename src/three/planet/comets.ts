import { BufferAttribute, BufferGeometry, Vector3 } from "three";

import { hexToLinear } from "@convex/shared/color";
import { between, hashString, seededRandom } from "@convex/shared/random";

import type { RenderTier } from "../quality";

// Comets in orbit (SPEC §2.2): each recent comet is a short glowing streak. A comet's orbit
// comes from its id, so it keeps its path across visits and devices.

/** Most comets drawn per tier. Tier 0 draws none; the list still shows them all. */
export const COMET_LIMIT: Record<RenderTier, number> = { 1: 6, 2: 12, 3: 12 };
/** Points per streak: a head and a fading tail. */
export const TRAIL_POINTS = 10;
/** Radians between tail points. */
export const TRAIL_SPACING = 0.045;
export const COMET_RADIUS = 1.4;

export interface CometOrbit {
  radius: number;
  phase: number;
  inclination: number;
  /** Radians per world second. */
  speed: number;
}

export function cometOrbit(id: string): CometOrbit {
  const random = seededRandom(hashString(id));
  return {
    radius: between(random, 1.18, 1.36),
    phase: between(random, 0, Math.PI * 2),
    inclination: between(random, -0.7, 0.7),
    speed: between(random, 0.12, 0.22),
  };
}

/** One point per trail step. aOrbit: radius, phase, inclination, speed. aTrail: 0 head to 1 tail. */
export function createCometGeometry(ids: readonly string[]): BufferGeometry {
  const count = ids.length * TRAIL_POINTS;
  const orbits = new Float32Array(count * 4);
  const trail = new Float32Array(count);
  ids.forEach((id, comet) => {
    const { radius, phase, inclination, speed } = cometOrbit(id);
    for (let step = 0; step < TRAIL_POINTS; step += 1) {
      const i = comet * TRAIL_POINTS + step;
      orbits.set([radius, phase - step * TRAIL_SPACING, inclination, speed], i * 4);
      trail[i] = step / (TRAIL_POINTS - 1);
    }
  });
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(new Float32Array(count * 3), 3));
  geometry.setAttribute("aOrbit", new BufferAttribute(orbits, 4));
  geometry.setAttribute("aTrail", new BufferAttribute(trail, 1));
  // Positions come from the vertex shader, so bounds come from the orbit radius.
  geometry.computeBoundingSphere();
  if (geometry.boundingSphere) geometry.boundingSphere.radius = COMET_RADIUS;
  return geometry;
}

export function createCometUniforms(colorHex: string) {
  return {
    uTime: { value: 0 },
    uPixelRatio: { value: 1 },
    uCometColor: { value: new Vector3(...hexToLinear(colorHex)) },
  };
}

export type CometUniforms = ReturnType<typeof createCometUniforms>;

/** Per-frame update. Mutates `.value` only (safe in useFrame). */
export function tickComets(uniforms: CometUniforms, time: number, pixelRatio: number): void {
  uniforms.uTime.value = time;
  uniforms.uPixelRatio.value = pixelRatio;
}
