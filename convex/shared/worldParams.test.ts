import { describe, expect, it } from "vitest";

import {
  BIOMES,
  randomParams,
  randomWorldName,
  worldNameSchema,
  worldParamsSchema,
} from "./worldParams";

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
