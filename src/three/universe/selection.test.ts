import { describe, expect, it } from "vitest";

import { nearest, nearPlanetTier, selectNear } from "./selection";

const at = (slot: number, x: number) => ({ slot, x, y: 0, z: 0 });

describe("nearest", () => {
  it("ranks by distance and breaks ties by slot", () => {
    const items = [at(3, 5), at(1, -2), at(2, 2), at(0, 9)];
    expect(nearest(items, 0, 0, 0, 3).map((item) => item.slot)).toEqual([1, 2, 3]);
    expect(nearest(items, 0, 0, 0, 0)).toEqual([]);
    expect(nearest(items, 0, 0, 0, 9, 3).map((item) => item.slot)).toEqual([1, 2]);
  });
});

describe("selectNear", () => {
  it("fills from the ranking when nothing is shown yet", () => {
    expect(selectNear([], [5, 4, 3, 2], 2)).toEqual([5, 4]);
  });

  it("keeps shown worlds inside the hysteresis band", () => {
    // 9 dropped to third place: still inside 2 * 1.5 = 3, so it stays.
    expect(selectNear([9, 4], [4, 7, 9, 1], 2)).toEqual([9, 4]);
  });

  it("drops worlds that left the band", () => {
    expect(selectNear([9, 4], [4, 7, 1, 2, 9], 2)).toEqual([4, 7]);
  });
});

describe("nearPlanetTier", () => {
  it("draws only the closest world at full detail, and only on tier 3", () => {
    expect(nearPlanetTier(3, 0)).toBe(3);
    expect(nearPlanetTier(3, 1)).toBe(1);
    expect(nearPlanetTier(2, 0)).toBe(1);
  });
});
