import { describe, expect, it } from "vitest";

import {
  galaxyRadius,
  GOLDEN_ANGLE,
  isSectorKey,
  MAX_SECTORS,
  neighborSectors,
  sectorCenter,
  sectorCoords,
  sectorDistance,
  SECTOR_SIZE,
  sectorKeyFor,
  sectorKeyForSlot,
  slotToPosition,
  SPACING,
} from "./galaxy";

describe("slotToPosition", () => {
  it("follows the Vogel spiral from §8.4", () => {
    const slot = 10;
    const { x, z } = slotToPosition(slot);
    const r = SPACING * Math.sqrt(slot + 1);
    expect(Math.hypot(x, z)).toBeCloseTo(r, 9);
    expect(Math.atan2(z, x)).toBeCloseTo(
      Math.atan2(Math.sin(slot * GOLDEN_ANGLE), Math.cos(slot * GOLDEN_ANGLE)),
      9,
    );
  });

  it("is stable and keeps a thin disc", () => {
    expect(slotToPosition(1234)).toEqual(slotToPosition(1234));
    for (let slot = 0; slot < 500; slot += 1) {
      expect(Math.abs(slotToPosition(slot).y)).toBeLessThanOrEqual(4);
    }
  });
});

describe("sector keys", () => {
  it("floors coordinates into sectors, negatives included", () => {
    expect(sectorKeyFor(0, 0)).toBe("0:0");
    expect(sectorKeyFor(SECTOR_SIZE - 0.01, -0.01)).toBe("0:-1");
    expect(sectorKeyFor(-SECTOR_SIZE, SECTOR_SIZE)).toBe("-1:1");
  });

  it("places the first slots in the core sectors", () => {
    expect(["0:0", "-1:0", "0:-1", "-1:-1"]).toContain(sectorKeyForSlot(0));
    const { x, z } = slotToPosition(5000);
    expect(sectorKeyForSlot(5000)).toBe(sectorKeyFor(x, z));
  });
});

describe("streaming helpers", () => {
  it("lists the current sector first, then its 8 neighbours", () => {
    const keys = neighborSectors(10, -10);
    expect(keys).toHaveLength(MAX_SECTORS);
    expect(keys[0]).toBe("0:-1");
    expect(new Set(keys).size).toBe(MAX_SECTORS);
    expect(keys).toContain("-1:-2");
    expect(keys).toContain("1:0");
  });

  it("parses keys and rejects anything else", () => {
    expect(sectorCoords("-3:4")).toEqual({ sx: -3, sz: 4 });
    expect(sectorCoords("3")).toBeNull();
    expect(sectorCoords("a:b")).toBeNull();
    expect(isSectorKey("1:2:3")).toBe(false);
    expect(sectorCenter("0:-1")).toEqual({ x: SECTOR_SIZE / 2, z: -SECTOR_SIZE / 2 });
  });

  it("measures sector distance", () => {
    expect(sectorDistance("0:0", "2:-1")).toBe(2);
    expect(sectorDistance("0:0", "x")).toBe(Number.POSITIVE_INFINITY);
  });

  it("keeps every slot inside the galaxy radius", () => {
    for (const slot of [0, 9, 99, 9999]) {
      const { x, z } = slotToPosition(slot);
      expect(Math.hypot(x, z)).toBeLessThanOrEqual(galaxyRadius(slot) + 1e-9);
    }
  });
});
