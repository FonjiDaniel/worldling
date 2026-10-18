import { describe, expect, it } from "vitest";

import { clampLevel, levelForXp, unlocksFor } from "./bloom";

describe("bloom levels", () => {
  it("maps cumulative XP to levels", () => {
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(49)).toBe(1);
    expect(levelForXp(50)).toBe(2);
    expect(levelForXp(1999)).toBe(9);
    expect(levelForXp(99999)).toBe(10);
  });

  it("clamps odd levels", () => {
    expect(clampLevel(0)).toBe(1);
    expect(clampLevel(42)).toBe(10);
    expect(clampLevel(Number.NaN)).toBe(1);
  });

  it("unlocks features in SPEC order", () => {
    expect(unlocksFor(1)).toEqual({
      cloudDrift: false,
      glints: false,
      vegetation: false,
      nightLights: false,
      moons: 0,
      fireflies: false,
      aurora: false,
      halo: false,
    });
    expect(unlocksFor(2).cloudDrift).toBe(true);
    expect(unlocksFor(5).nightLights).toBe(true);
    expect(unlocksFor(6).moons).toBe(1);
    expect(unlocksFor(9).moons).toBe(2);
    expect(unlocksFor(10).halo).toBe(true);
  });
});
