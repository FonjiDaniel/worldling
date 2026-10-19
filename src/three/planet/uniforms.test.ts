import { describe, expect, it } from "vitest";

import { BIOMES, presetParams, randomParams } from "@convex/shared/worldParams";

import type { ArtColors } from "../art";
import { TIERS } from "../quality";
import { paramsToUniforms, seedOffset, shallowColor, spinPeriod } from "./uniforms";

const art: ArtColors = {
  space: "#07071a",
  keyLight: "#fff4ed",
  fillLight: "#cbc2ff",
  nightLights: "#ffb394",
  firefly: "#ffcdb6",
  comet: "#ffe5d7",
  aurora: "#3fe0c5",
  halo: "#a99fff",
  moon: "#9a9bb8",
  nebula: "#7c6cff",
  star: "#f4f1ea",
};

describe("paramsToUniforms", () => {
  it("is pure: the same params always give the same uniforms", () => {
    for (let seed = 0; seed < 50; seed += 1) {
      const params = randomParams(seed * 104729);
      expect(paramsToUniforms(params, 2, 5, art)).toEqual(paramsToUniforms(params, 2, 5, art));
      expect(paramsToUniforms(structuredClone(params), 2, 5, art)).toEqual(
        paramsToUniforms(params, 2, 5, art),
      );
    }
  });

  it("gives every seed its own noise region", () => {
    expect(seedOffset(1)).not.toEqual(seedOffset(2));
    for (const axis of seedOffset(123456)) expect(Math.abs(axis)).toBeLessThanOrEqual(20);
  });

  it("only changes octaves and detail between tiers", () => {
    const params = presetParams("frozen", 3);
    const low = paramsToUniforms(params, 1, 4, art);
    const high = paramsToUniforms(params, 3, 4, art);
    expect({ ...low, octaves: 0, detail: 0 }).toEqual({ ...high, octaves: 0, detail: 0 });
    expect([low.octaves, high.octaves]).toEqual([TIERS[1].octaves, TIERS[3].octaves]);
    expect([low.detail, high.detail]).toEqual([24, 80]);
  });

  it("turns bloom features on by level", () => {
    const params = presetParams("verdant", 1);
    const base = paramsToUniforms(params, 2, 1, art);
    expect(base.features).toEqual({ glints: 0, vegetation: 0, nightLights: 0, aurora: 0, halo: 0 });
    expect(base.cloudDrift).toBe(0);
    expect(base.moons).toBe(0);
    const full = paramsToUniforms(params, 2, 10, art);
    expect(full.features).toEqual({ glints: 1, vegetation: 1, nightLights: 1, aurora: 1, halo: 1 });
    expect(full.cloudDrift).toBeGreaterThan(0);
    expect(full.moons).toBe(2);
    expect(full.fireflies).toBe(true);
  });

  it("converts colors to linear light", () => {
    const data = paramsToUniforms(presetParams("oceanic", 1), 2, 1, art);
    expect(data.stops).toHaveLength(5);
    for (const stop of data.stops) for (const c of stop) expect(c).toBeGreaterThanOrEqual(0);
    // #245d82: 0x24 / 255 = 0.141 in sRGB, about 0.0176 in linear light.
    expect(data.ocean[0]).toBeCloseTo(0.0176, 3);
  });

  it("maps biomes to shader indices and only volcanic seas glow", () => {
    BIOMES.forEach((biome, index) => {
      const data = paramsToUniforms(presetParams(biome, 1), 2, 1, art);
      expect(data.biome).toBe(index);
      expect(data.oceanEmissive).toBe(biome === "volcanic" ? 1 : 0);
    });
  });
});

describe("motion and color mapping", () => {
  it("spin 0.5 is the 120s brand rotation, slower and faster at the ends", () => {
    expect(spinPeriod(0.5)).toBe(120);
    expect(spinPeriod(0)).toBe(240);
    expect(spinPeriod(1)).toBe(60);
  });

  it("makes shallows lighter than the open sea", () => {
    const deep = paramsToUniforms(presetParams("oceanic", 1), 2, 1, art).ocean;
    const sum = (rgb: readonly number[]) => rgb.reduce((a, b) => a + b, 0);
    expect(sum(shallowColor("#245d82"))).toBeGreaterThan(sum(deep));
  });
});
