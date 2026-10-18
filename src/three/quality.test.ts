import { describe, expect, it } from "vitest";

import {
  dprFor,
  isRenderTier,
  MAX_TIER_CHANGES,
  nextTierOnDecline,
  type Tier,
  TIERS,
  tierFromGpu,
} from "./quality";

describe("quality tiers", () => {
  it("matches the SPEC §8.2 table", () => {
    expect([TIERS[1].detail, TIERS[2].detail, TIERS[3].detail]).toEqual([24, 48, 80]);
    expect([TIERS[1].bloom, TIERS[2].bloom, TIERS[3].bloom]).toEqual([false, false, true]);
    expect(dprFor(1, 3)).toBe(1);
    expect(dprFor(2, 3)).toBe(1.5);
    expect(dprFor(3, 3)).toBe(2);
    expect(dprFor(3, 1)).toBe(1);
  });

  it("maps detect-gpu results, with no WebGL as tier 0", () => {
    expect(tierFromGpu({ tier: 0, type: "WEBGL_UNSUPPORTED" })).toBe(0);
    expect(tierFromGpu({ tier: 0, type: "BLOCKLISTED" })).toBe(0);
    expect(tierFromGpu({ tier: 0, type: "FALLBACK" })).toBe(1);
    expect(tierFromGpu({ tier: 2, type: "BENCHMARK" })).toBe(2);
    expect(tierFromGpu({ tier: 3, type: "BENCHMARK" })).toBe(3);
  });

  it("drops one tier at a time and never more than twice", () => {
    expect(nextTierOnDecline(3, 0)).toBe(2);
    expect(nextTierOnDecline(2, 1)).toBe(1);
    expect(nextTierOnDecline(2, MAX_TIER_CHANGES)).toBeNull();
    expect(nextTierOnDecline(1, 0)).toBeNull();
  });

  it("knows which tiers render", () => {
    const tiers: (Tier | null)[] = [null, 0, 1, 2, 3];
    expect(tiers.map(isRenderTier)).toEqual([false, false, true, true, true]);
  });
});
