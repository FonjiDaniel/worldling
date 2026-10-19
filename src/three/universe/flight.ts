// Camera flight curve (SPEC §8.5): lift off the galaxy plane, drift across, then descend onto
// the world. Writes into caller-owned objects, so it is safe to call every frame.

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface FlightEnds {
  fromPosition: Vec3;
  fromTarget: Vec3;
  toPosition: Vec3;
  toTarget: Vec3;
}

/** Shortest and longest flights, inside §3.5's 1.2 to 2.0 seconds. */
export const FLIGHT_MIN_S = 1.2;
export const FLIGHT_MAX_S = 2;
/** Flights longer than this show a Skip control (§8.5). */
export const SKIP_AFTER_S = 1.5;
const LIFT_PER_UNIT = 0.35;
const MAX_LIFT = 220;
const SECONDS_PER_UNIT = 1 / 600;

const span = (ends: FlightEnds): number =>
  Math.hypot(
    ends.toTarget.x - ends.fromTarget.x,
    ends.toTarget.y - ends.fromTarget.y,
    ends.toTarget.z - ends.fromTarget.z,
  );

/** Longer trips take longer, within the motion budget. */
export function flightDuration(ends: FlightEnds): number {
  return Math.min(FLIGHT_MAX_S, FLIGHT_MIN_S + span(ends) * SECONDS_PER_UNIT);
}

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/**
 * Samples the flight at progress `t` (0..1, already eased). The camera follows a parabola that
 * peaks halfway, so the galaxy opens up mid-flight; the look target moves in a straight line.
 */
export function sampleFlight(ends: FlightEnds, t: number, position: Vec3, target: Vec3): void {
  const lift = Math.min(MAX_LIFT, span(ends) * LIFT_PER_UNIT) * 4 * t * (1 - t);
  position.x = lerp(ends.fromPosition.x, ends.toPosition.x, t);
  position.y = lerp(ends.fromPosition.y, ends.toPosition.y, t) + lift;
  position.z = lerp(ends.fromPosition.z, ends.toPosition.z, t);
  target.x = lerp(ends.fromTarget.x, ends.toTarget.x, t);
  target.y = lerp(ends.fromTarget.y, ends.toTarget.y, t);
  target.z = lerp(ends.fromTarget.z, ends.toTarget.z, t);
}

/** Where the camera rests to look at a world: 25 degrees up (05), from the side it came. */
export function arrivalPosition(from: Vec3, world: Vec3, distance: number, out: Vec3): void {
  const dx = from.x - world.x;
  const dz = from.z - world.z;
  const ground = Math.hypot(dx, dz) || 1;
  const elevation = (25 * Math.PI) / 180;
  const horizontal = distance * Math.cos(elevation);
  out.x = world.x + (dx / ground) * horizontal;
  out.y = world.y + distance * Math.sin(elevation);
  out.z = world.z + (dz / ground) * horizontal;
}
