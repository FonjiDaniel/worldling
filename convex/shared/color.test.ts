import { describe, expect, it } from "vitest";

import { clampColor, hexToLinear, hexToRgb, hslToRgb, rgbToHex, rgbToHsl } from "./color";

describe("color helpers", () => {
  it("round-trips hex through rgb and hsl", () => {
    for (const hex of ["#245d82", "#f28d60", "#8c7aaf", "#e8edef", "#000000"]) {
      expect(rgbToHex(hexToRgb(hex))).toBe(hex);
      expect(rgbToHex(hslToRgb(rgbToHsl(hexToRgb(hex))))).toBe(hex);
    }
  });

  it("clamps lightness and chroma but keeps hue", () => {
    expect(clampColor("#245d82")).toBe("#245d82");
    expect(clampColor("#fff4e3")).toBe("#fff4e3");
    const white = rgbToHsl(hexToRgb(clampColor("#ffffff")));
    expect(white.l).toBeLessThanOrEqual(0.985);
    const [r, g, b] = hexToRgb(clampColor("#ff0000"));
    expect(Math.max(r, g, b) - Math.min(r, g, b)).toBeLessThanOrEqual(0.81);
    expect(rgbToHsl([r, g, b]).h).toBeCloseTo(0, 0);
  });

  it("converts to linear light", () => {
    expect(hexToLinear("#000000")).toEqual([0, 0, 0]);
    expect(hexToLinear("#ffffff")).toEqual([1, 1, 1]);
    expect(hexToLinear("#808080")[0]).toBeCloseTo(0.2159, 3);
  });
});
