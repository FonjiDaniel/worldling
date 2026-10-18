import { z } from "zod";

import { clampColor } from "./color";
import { countGraphemes } from "./graphemes";
import { between, clamp, pick, seededRandom } from "./random";
import { type CuratedPalette, palettesFor } from "./worldPalettes";

export { describeWorld } from "./worldDescription";

// World parameters (SPEC §2.3, §5.2 worldParamsV1): zod schema, clamps, biome presets and
// randomParams. Palettes live in worldPalettes.ts, describeWorld in worldDescription.ts.

export const BIOMES = ["oceanic", "verdant", "desert", "frozen", "volcanic", "crystal"] as const;
export type Biome = (typeof BIOMES)[number];

export const WORLD_NAME_MAX = 32;

/** Thumbnail rules (SPEC §8.7), checked by `worlds.setThumbnail`. */
export const THUMBNAIL_TYPE = "image/webp";
export const THUMBNAIL_MAX_BYTES = 300 * 1024;
export const THUMBNAIL_SIZE = 512;

/** A hex color, lowercased and clamped into the safe ranges (ADR-009). */
const hex = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/)
  .transform((value) => clampColor(value.toLowerCase()));

/** A number clamped into [min, max] instead of rejected, so old drafts still load. */
const ranged = (min: number, max: number) =>
  z
    .number()
    .refine(Number.isFinite)
    .transform((value) => clamp(value, min, max));

export const worldParamsSchema = z.object({
  version: z.literal(1),
  seed: z.int().min(0).max(0xffffffff),
  biome: z.enum(BIOMES),
  terrain: z.object({
    scale: ranged(0.5, 3),
    roughness: ranged(0, 1),
    amplitude: ranged(0, 0.25),
    seaLevel: ranged(0, 1),
  }),
  palette: z.object({ id: z.string().min(1).max(32), stops: z.array(hex).length(5) }),
  ocean: z.object({ color: hex, gloss: ranged(0, 1) }),
  atmosphere: z.object({ color: hex, density: ranged(0, 1) }),
  clouds: z.object({ coverage: ranged(0, 1), speed: ranged(0, 1), color: hex }),
  motion: z.object({ spin: ranged(0, 1), tilt: ranged(0, 0.5) }),
  // Cosmetics are validated against entitlements (§14); none exist in v1.0.
  cosmetics: z.array(z.string()).max(0),
});

export type WorldParams = z.output<typeof worldParamsSchema>;

interface Preset {
  terrain: WorldParams["terrain"];
  gloss: number;
  density: number;
  coverage: number;
  cloudSpeed: number;
}

/** Tuned starting points per biome, matched to the six-world moodboard. */
export const PRESETS: Record<Biome, Preset> = {
  oceanic: {
    terrain: { scale: 0.7, roughness: 0.3, amplitude: 0.07, seaLevel: 0.62 },
    gloss: 0.7,
    density: 0.55,
    coverage: 0.3,
    cloudSpeed: 0.3,
  },
  verdant: {
    terrain: { scale: 1.2, roughness: 0.45, amplitude: 0.07, seaLevel: 0.2 },
    gloss: 0.6,
    density: 0.5,
    coverage: 0.3,
    cloudSpeed: 0.3,
  },
  desert: {
    terrain: { scale: 1.0, roughness: 0.4, amplitude: 0.07, seaLevel: 0.08 },
    gloss: 0.5,
    density: 0.45,
    coverage: 0.1,
    cloudSpeed: 0.25,
  },
  frozen: {
    terrain: { scale: 1.2, roughness: 0.5, amplitude: 0.08, seaLevel: 0.36 },
    gloss: 0.3,
    density: 0.55,
    coverage: 0.25,
    cloudSpeed: 0.25,
  },
  volcanic: {
    terrain: { scale: 1.3, roughness: 0.5, amplitude: 0.07, seaLevel: 0.16 },
    gloss: 0.4,
    density: 0.4,
    coverage: 0.15,
    cloudSpeed: 0.2,
  },
  crystal: {
    terrain: { scale: 1.2, roughness: 0.45, amplitude: 0.07, seaLevel: 0.24 },
    gloss: 0.6,
    density: 0.6,
    coverage: 0.2,
    cloudSpeed: 0.25,
  },
};

function firstPalette(biome: Biome): CuratedPalette {
  const [first] = palettesFor(biome);
  if (!first) throw new Error(`No palette for ${biome}`);
  return first;
}

function build(seed: number, biome: Biome, palette: CuratedPalette, preset: Preset): WorldParams {
  return {
    version: 1,
    seed: seed >>> 0,
    biome,
    terrain: { ...preset.terrain },
    palette: { id: palette.id, stops: [...palette.stops] },
    ocean: { color: palette.ocean, gloss: preset.gloss },
    atmosphere: { color: palette.atmosphere, density: preset.density },
    clouds: { coverage: preset.coverage, speed: preset.cloudSpeed, color: palette.clouds },
    motion: { spin: 0.5, tilt: 0.2 },
    cosmetics: [],
  };
}

/** The untouched preset for a biome, with its brand palette. */
export function presetParams(biome: Biome, seed: number): WorldParams {
  return build(seed, biome, firstPalette(biome), PRESETS[biome]);
}

/** A complete, valid world for a seed. The same seed always gives the same world. */
export function randomParams(seed: number): WorldParams {
  const random = seededRandom(seed);
  const biome = pick(random, BIOMES);
  const [first, ...rest] = palettesFor(biome);
  const palette = first ? pick(random, [first, ...rest]) : firstPalette(biome);
  const preset = PRESETS[biome];
  const jitter = (value: number, spread: number, min: number, max: number) =>
    clamp(value + between(random, -spread, spread), min, max);
  return build(seed, biome, palette, {
    terrain: {
      scale: jitter(preset.terrain.scale, 0.3, 0.5, 3),
      roughness: jitter(preset.terrain.roughness, 0.1, 0, 1),
      amplitude: jitter(preset.terrain.amplitude, 0.02, 0, 0.25),
      seaLevel: jitter(preset.terrain.seaLevel, 0.06, 0, 1),
    },
    gloss: jitter(preset.gloss, 0.1, 0, 1),
    density: jitter(preset.density, 0.1, 0, 1),
    coverage: jitter(preset.coverage, 0.1, 0, 1),
    cloudSpeed: jitter(preset.cloudSpeed, 0.1, 0, 1),
  });
}

const NAME_STARTS: readonly [string, ...string[]] = [
  "Moss",
  "Dawn",
  "Ember",
  "Tide",
  "Frost",
  "Glim",
  "Lumen",
  "Sol",
  "Vel",
  "Wren",
];
const NAME_ENDS: readonly [string, ...string[]] = [
  "bright",
  "hollow",
  "reach",
  "mere",
  "fall",
  "haven",
  "drift",
  "spire",
  "glow",
  "vale",
];

/** A gentle default name, like "Mossbright". */
export function randomWorldName(seed: number): string {
  const random = seededRandom(seed ^ 0x5bd1e995);
  return `${pick(random, NAME_STARTS)}${pick(random, NAME_ENDS)}`;
}

export const worldNameSchema = z
  .string()
  .transform((value) => value.replace(/\s+/g, " ").trim())
  .refine((value) => value !== "" && countGraphemes(value) <= WORLD_NAME_MAX);
