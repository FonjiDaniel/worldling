import { describe, expect, it } from "vitest";

import {
  GOLDEN_ANGLE,
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
