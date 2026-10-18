// A small mutable object pages use to move a planet without re-rendering React: GSAP tweens
// and pointer drags write it, Planet reads it in useFrame (SPEC §8.10, no allocations).

export interface PlanetHandle {
  /** 0 is the world as made, 1 settles the terrain flat (the randomize re-form). */
  reform: number;
  /** Extra turn in radians on top of ambient spin: drag to turn, the randomize spin. */
  yaw: number;
  /** Pins world time for this planet (thumbnails). null follows the shared clock. */
  time: number | null;
}

export function createPlanetHandle(time: number | null = null): PlanetHandle {
  return { reform: 0, yaw: 0, time };
}

/** For planets nobody steers. Never written. */
export const RESTING_HANDLE: Readonly<PlanetHandle> = Object.freeze(createPlanetHandle());

/** The re-form also shrinks the world slightly, at most 4% (05 bloom-reveal scale). */
export const REFORM_SHRINK = 0.04;

/** Turns the world by `radians`. A plain function, so React code never writes the handle itself. */
export function turnPlanet(handle: PlanetHandle, radians: number): void {
  handle.yaw += radians;
}
