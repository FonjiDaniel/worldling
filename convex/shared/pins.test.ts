import { describe, expect, it } from "vitest";

import { hexToRgb, rgbToHsl } from "./color";
import { pinColors } from "./pins";
import { randomParams } from "./worldParams";

const lightness = (hex: string) => rgbToHsl(hexToRgb(hex)).l;

describe("pinColors", () => {
  it("is stable for the same params", () => {
    expect(pinColors(randomParams(42))).toEqual(pinColors(randomParams(42)));
  });

  it("keeps both colors readable on Void", () => {
    for (let seed = 1; seed < 200; seed += 1) {
      const { colorA, colorB } = pinColors(randomParams(seed));
      for (const color of [colorA, colorB]) {
        expect(color).toMatch(/^#[0-9a-f]{6}$/);
        expect(lightness(color)).toBeGreaterThanOrEqual(0.44);
        expect(lightness(color)).toBeLessThanOrEqual(0.83);
      }
    }
  });

  it("lifts a very dark land stop", () => {
    const params = randomParams(3);
    params.palette.stops[2] = "#101010";
    expect(lightness(pinColors(params).colorA)).toBeCloseTo(0.45, 2);
  });
});
