import { describe, expect, it } from "vitest";

import {
  clampLevel,
  DAILY_CAPS,
  levelForXp,
  progressFor,
  streakAfter,
  streakBonus,
  unlocksFor,
  XP,
} from "./bloom";
import { levelUpMessage, nextBloomLine } from "./bloomCopy";

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

describe("bloom XP rules", () => {
  it("extends a streak only on consecutive days", () => {
    expect(streakAfter(undefined, "2026-10-18", 0)).toBe(1);
    expect(streakAfter("2026-10-18", "2026-10-18", 3)).toBe(4);
    expect(streakAfter("2026-10-16", "2026-10-18", 3)).toBe(1);
  });

  it("gives +1 per consecutive day after the first, up to +5", () => {
    expect([1, 2, 3, 6, 7, 30].map(streakBonus)).toEqual([0, 1, 2, 5, 5, 5]);
    expect(streakBonus(0)).toBe(0);
  });

  it("matches the SPEC caps", () => {
    expect(XP).toEqual({ tend: 10, visit: 2, cometReceived: 5, cometSent: 1 });
    expect(DAILY_CAPS).toEqual({ visits: 20, cometsReceived: 10, cometsSent: 5 });
  });

  it("reports progress through the current level", () => {
    expect(progressFor(0)).toEqual({ level: 1, levelXp: 0, nextXp: 50, fraction: 0 });
    expect(progressFor(95)).toEqual({ level: 2, levelXp: 50, nextXp: 140, fraction: 0.5 });
    expect(progressFor(5000)).toEqual({ level: 10, levelXp: 2000, nextXp: null, fraction: 1 });
    expect(progressFor(-3).fraction).toBe(0);
  });
});

describe("bloom copy", () => {
  it("names the next unlock and the top level", () => {
    expect(nextBloomLine(5)).toBe("Next bloom: a first moon.");
    expect(nextBloomLine(10)).toBe("In full bloom.");
  });

  it("uses the 07 new moon line for moons", () => {
    expect(levelUpMessage(6)).toBe("Your world has a new moon. Take a look.");
    expect(levelUpMessage(9)).toBe(levelUpMessage(6));
  });

  it("has warm copy for every level up, without exclamation marks or em dashes", () => {
    for (let level = 1; level <= 10; level += 1) {
      for (const line of [nextBloomLine(level), level > 1 ? levelUpMessage(level) : "x"]) {
        expect(line).not.toBe("");
        expect(line).not.toMatch(/[!—]/);
      }
    }
  });
});
