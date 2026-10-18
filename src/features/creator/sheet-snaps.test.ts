import { describe, expect, it } from "vitest";

import { settleSnap, snapHeights, stepSnap } from "./sheet-snaps";

const viewport = 800;
const heights = snapHeights(viewport, 140);

describe("sheet snaps", () => {
  it("sizes the snaps from the viewport and the peek content", () => {
    expect(heights).toEqual({ peek: 140, half: 320, full: 704 });
    expect(snapHeights(300, 200).half).toBe(200);
  });

  it("steps between snaps without running off the ends", () => {
    expect(stepSnap("peek", 1)).toBe("half");
    expect(stepSnap("full", 1)).toBe("full");
    expect(stepSnap("peek", -1)).toBe("peek");
  });

  it("settles on the closest snap, or one step on a flick", () => {
    expect(settleSnap(600, 0, heights, "half", viewport)).toBe("full");
    expect(settleSnap(200, 0, heights, "half", viewport)).toBe("peek");
    expect(settleSnap(330, 2000, heights, "half", viewport)).toBe("full");
    expect(settleSnap(330, -2000, heights, "half", viewport)).toBe("peek");
  });
});
