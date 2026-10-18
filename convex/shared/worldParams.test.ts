import { describe, expect, it } from "vitest";

import { clampColor } from "./color";
import {
  BIOMES,
  describeWorld,
  presetParams,
  randomParams,
  randomWorldName,
  worldNameSchema,
  worldParamsSchema,
} from "./worldParams";
import { PALETTES, palettesFor } from "./worldPalettes";

describe("randomParams", () => {
  it("is deterministic per seed", () => {
    expect(randomParams(42)).toEqual(randomParams(42));
    expect(randomParams(42)).not.toEqual(randomParams(43));
  });

  it("always produces valid params that survive parsing unchanged", () => {
    for (let seed = 0; seed < 200; seed += 1) {
      const params = randomParams(seed * 7919);
      expect(worldParamsSchema.parse(params)).toEqual(params);
    }
  });

  it("reaches every biome", () => {
    const seen = new Set(Array.from({ length: 300 }, (_, seed) => randomParams(seed).biome));
    expect([...seen].sort()).toEqual([...BIOMES].sort());
  });
});

describe("worldParamsSchema", () => {
  it("clamps out-of-range numbers instead of rejecting", () => {
    const params = randomParams(1);
    const parsed = worldParamsSchema.parse({
      ...params,
      terrain: { ...params.terrain, scale: 99, amplitude: -1 },
    });
    expect(parsed.terrain.scale).toBe(3);
    expect(parsed.terrain.amplitude).toBe(0);
  });

  it("lowercases colors and rejects bad ones", () => {
    const params = randomParams(1);
    expect(
      worldParamsSchema.parse({ ...params, ocean: { ...params.ocean, color: "#ABCDEF" } }).ocean
        .color,
    ).toBe("#abcdef");
    expect(
      worldParamsSchema.safeParse({ ...params, ocean: { ...params.ocean, color: "red" } }).success,
    ).toBe(false);
  });

  it("rejects non-finite numbers, wrong palettes and cosmetics", () => {
    const params = randomParams(1);
    const bad = [
      { ...params, terrain: { ...params.terrain, scale: Number.NaN } },
      { ...params, palette: { ...params.palette, stops: params.palette.stops.slice(0, 4) } },
      { ...params, cosmetics: ["halo"] },
    ];
    for (const candidate of bad) expect(worldParamsSchema.safeParse(candidate).success).toBe(false);
  });
});

describe("world names", () => {
  it("gives a stable default name", () => {
    expect(randomWorldName(5)).toBe(randomWorldName(5));
    expect(randomWorldName(5)).toMatch(/^[A-Z][a-z]+$/);
  });

  it("trims and limits names to 32 graphemes", () => {
    expect(worldNameSchema.parse("  Moss   bright ")).toBe("Moss bright");
    expect(worldNameSchema.safeParse("").success).toBe(false);
    expect(worldNameSchema.safeParse("a".repeat(33)).success).toBe(false);
  });
});

describe("presets and palettes", () => {
  it("has at least 18 curated palettes, four per biome, with unique ids", () => {
    expect(PALETTES.length).toBeGreaterThanOrEqual(18);
    for (const biome of BIOMES) expect(palettesFor(biome)).toHaveLength(4);
    expect(new Set(PALETTES.map((palette) => palette.id)).size).toBe(PALETTES.length);
  });

  it("keeps every curated color inside the safe clamp ranges", () => {
    for (const palette of PALETTES) {
      for (const color of [...palette.stops, palette.ocean, palette.atmosphere, palette.clouds]) {
        expect(clampColor(color)).toBe(color);
      }
    }
  });

  it("gives a valid preset per biome that uses the biome's brand palette", () => {
    for (const biome of BIOMES) {
      const params = presetParams(biome, 1);
      expect(worldParamsSchema.parse(params)).toEqual(params);
      expect(params.palette.id).toBe(palettesFor(biome)[0]?.id);
    }
  });

  it("clamps custom colors that are too bright or too saturated", () => {
    const params = randomParams(1);
    const parsed = worldParamsSchema.parse({
      ...params,
      palette: { id: "custom", stops: ["#ffffff", "#000000", "#ff0000", "#00ff00", "#123456"] },
    });
    expect(parsed.palette.stops[4]).toBe("#123456");
    expect(parsed.palette.stops.slice(0, 4)).not.toEqual([
      "#ffffff",
      "#000000",
      "#ff0000",
      "#00ff00",
    ]);
  });
});

describe("describeWorld", () => {
  it("names the biome, water, clouds and moons", () => {
    const params = presetParams("frozen", 1);
    expect(describeWorld(params)).toBe("A frozen world with turquoise seas and wisps of cloud.");
    expect(describeWorld(params, 9)).toBe(
      "A frozen world with turquoise seas, wisps of cloud, night lights and two moons.",
    );
    expect(describeWorld(presetParams("oceanic", 1), 6)).toMatch(
      /^An oceanic world with .*one moon\.$/,
    );
  });

  it("describes lava, lakes and cloud density", () => {
    expect(describeWorld(presetParams("volcanic", 1))).toContain("lava seams");
    expect(describeWorld(presetParams("desert", 1))).toContain("lakes and wisps of cloud");
    const cloudy = presetParams("verdant", 1);
    expect(describeWorld({ ...cloudy, clouds: { ...cloudy.clouds, coverage: 0.9 } })).toContain(
      "thick clouds",
    );
  });

  it("never uses an em dash", () => {
    for (let seed = 0; seed < 100; seed += 1) {
      expect(describeWorld(randomParams(seed), 10)).not.toContain("—");
    }
  });
});
