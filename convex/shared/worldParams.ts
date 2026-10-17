import { z } from "zod";

import { countGraphemes } from "./graphemes";
import { between, clamp, pick, seededRandom } from "./random";

// World parameters (SPEC §2.3, §5.2 worldParamsV1). Started minimal in Phase 4 so onboarding
// can create a world; Phase 5 adds the curated palettes, tuning and describeWorld.

export const BIOMES = ["oceanic", "verdant", "desert", "frozen", "volcanic", "crystal"] as const;
export type Biome = (typeof BIOMES)[number];

export const WORLD_NAME_MAX = 32;

const hex = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/)
  .transform((value) => value.toLowerCase());

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
  palette: readonly [string, string, string, string, string];
  ocean: string;
  atmosphere: string;
  clouds: string;
  seaLevel: number;
}

const PRESETS: Record<Biome, Preset> = {
  oceanic: {
    palette: ["#0b3d63", "#1f7a8c", "#7fc8a9", "#e9d8a6", "#f4f1ea"],
    ocean: "#1b4f8a",
    atmosphere: "#8ab4ff",
    clouds: "#f4f1ea",
    seaLevel: 0.62,
  },
  verdant: {
    palette: ["#2e4a2c", "#4f7a3a", "#8fb85b", "#c9b37e", "#efe9d8"],
    ocean: "#1e5d74",
    atmosphere: "#9fe2d0",
    clouds: "#f6f3ec",
    seaLevel: 0.45,
  },
  desert: {
    palette: ["#7a3f1d", "#b8642e", "#e0a35b", "#f1cf8f", "#fbeed2"],
    ocean: "#2f6f78",
    atmosphere: "#ffc89a",
    clouds: "#fff4e3",
    seaLevel: 0.2,
  },
  frozen: {
    palette: ["#3b5a7a", "#6f93b5", "#a9c6dd", "#dbe8f2", "#ffffff"],
    ocean: "#2a5b85",
    atmosphere: "#cfe4ff",
    clouds: "#ffffff",
    seaLevel: 0.4,
  },
  volcanic: {
    palette: ["#1a1414", "#3d2420", "#6e2f1f", "#c2461f", "#ff8a5b"],
    ocean: "#3a1c1c",
    atmosphere: "#ff9f7a",
    clouds: "#5b4a4a",
    seaLevel: 0.3,
  },
  crystal: {
    palette: ["#2b1d5c", "#5b3fb0", "#7c6cff", "#a99fff", "#e7e2ff"],
    ocean: "#3fe0c5",
    atmosphere: "#c4b8ff",
    clouds: "#efeaff",
    seaLevel: 0.5,
  },
};

/** A complete, valid world for a seed. The same seed always gives the same world. */
export function randomParams(seed: number): WorldParams {
  const random = seededRandom(seed);
  const biome = pick(random, BIOMES);
  const preset = PRESETS[biome];
  return {
    version: 1,
    seed: seed >>> 0,
    biome,
    terrain: {
      scale: between(random, 0.9, 2.2),
      roughness: between(random, 0.3, 0.7),
      amplitude: between(random, 0.06, 0.16),
      seaLevel: clamp(preset.seaLevel + between(random, -0.08, 0.08), 0, 1),
    },
    palette: { id: biome, stops: [...preset.palette] },
    ocean: { color: preset.ocean, gloss: between(random, 0.4, 0.8) },
    atmosphere: { color: preset.atmosphere, density: between(random, 0.35, 0.7) },
    clouds: {
      coverage: between(random, 0.25, 0.6),
      speed: between(random, 0.2, 0.5),
      color: preset.clouds,
    },
    motion: { spin: between(random, 0.2, 0.5), tilt: between(random, 0.05, 0.35) },
    cosmetics: [],
  };
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
