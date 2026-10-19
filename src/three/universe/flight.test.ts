import { describe, expect, it } from "vitest";

import {
  arrivalPosition,
  FLIGHT_MAX_S,
  FLIGHT_MIN_S,
  flightDuration,
  type FlightEnds,
  sampleFlight,
  type Vec3,
} from "./flight";

const v = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
const ends = (distance: number): FlightEnds => ({
  fromPosition: v(0, 10, 10),
  fromTarget: v(0, 0, 0),
  toPosition: v(distance, 10, 10),
  toTarget: v(distance, 0, 0),
});

describe("flight", () => {
  it("starts and ends exactly on the ends", () => {
    const position = v(0, 0, 0);
    const target = v(0, 0, 0);
    const flight = ends(300);
    sampleFlight(flight, 0, position, target);
    expect(position).toEqual(flight.fromPosition);
    sampleFlight(flight, 1, position, target);
    expect(position).toEqual(flight.toPosition);
    expect(target).toEqual(flight.toTarget);
  });

  it("arcs above the plane halfway", () => {
    const position = v(0, 0, 0);
    sampleFlight(ends(300), 0.5, position, v(0, 0, 0));
    expect(position.y).toBeGreaterThan(10 + 100);
  });

  it("keeps duration inside the motion budget", () => {
    expect(flightDuration(ends(0))).toBe(FLIGHT_MIN_S);
    expect(flightDuration(ends(5000))).toBe(FLIGHT_MAX_S);
  });

  it("arrives 25 degrees above the world, on the side it came from", () => {
    const out = v(0, 0, 0);
    arrivalPosition(v(-100, 50, 0), v(10, 0, 0), 8, out);
    expect(out.x).toBeLessThan(10);
    expect(Math.atan2(out.y, Math.hypot(out.x - 10, out.z))).toBeCloseTo((25 * Math.PI) / 180, 6);
    expect(Math.hypot(out.x - 10, out.y, out.z)).toBeCloseTo(8, 6);
  });
});
