import { clampColor } from "@convex/shared/color";
import { randomSeed } from "@convex/shared/random";
import { findPalette } from "@convex/shared/worldPalettes";
import {
  type Biome,
  presetParams,
  randomParams,
  randomWorldName,
  type WorldParams,
  worldParamsSchema,
} from "@convex/shared/worldParams";

// Pure edits to world params, one per creator control (SPEC §2.2). Every result goes through
// the shared schema, so the creator holds exactly what the server will store.

/** What the creator edits: the world, its name, and whether the person typed that name. */
export interface CreatorWorld {
  name: string;
  nameEdited: boolean;
  params: WorldParams;
}

export function normalizeParams(params: WorldParams): WorldParams {
  return worldParamsSchema.parse(params);
}

export type SliderKey =
  | "amplitude"
  | "roughness"
  | "scale"
  | "seaLevel"
  | "coverage"
  | "cloudSpeed"
  | "density"
  | "gloss"
  | "spin"
  | "tilt";

export interface SliderSpec {
  label: string;
  min: number;
  max: number;
  get: (params: WorldParams) => number;
  set: (params: WorldParams, value: number) => WorldParams;
}

const terrain =
  (key: keyof WorldParams["terrain"]) =>
  (params: WorldParams, value: number): WorldParams => ({
    ...params,
    terrain: { ...params.terrain, [key]: value },
  });

export const SLIDERS: Record<SliderKey, SliderSpec> = {
  amplitude: {
    label: "Terrain",
    min: 0,
    max: 0.25,
    get: (p) => p.terrain.amplitude,
    set: terrain("amplitude"),
  },
  roughness: {
    label: "Ruggedness",
    min: 0,
    max: 1,
    get: (p) => p.terrain.roughness,
    set: terrain("roughness"),
  },
  scale: { label: "Detail", min: 0.5, max: 3, get: (p) => p.terrain.scale, set: terrain("scale") },
  seaLevel: {
    label: "Ocean",
    min: 0,
    max: 1,
    get: (p) => p.terrain.seaLevel,
    set: terrain("seaLevel"),
  },
  coverage: {
    label: "Cloud cover",
    min: 0,
    max: 1,
    get: (p) => p.clouds.coverage,
    set: (p, coverage) => ({ ...p, clouds: { ...p.clouds, coverage } }),
  },
  cloudSpeed: {
    label: "Cloud speed",
    min: 0,
    max: 1,
    get: (p) => p.clouds.speed,
    set: (p, speed) => ({ ...p, clouds: { ...p.clouds, speed } }),
  },
  density: {
    label: "Air glow",
    min: 0,
    max: 1,
    get: (p) => p.atmosphere.density,
    set: (p, density) => ({ ...p, atmosphere: { ...p.atmosphere, density } }),
  },
  gloss: {
    label: "Ocean shine",
    min: 0,
    max: 1,
    get: (p) => p.ocean.gloss,
    set: (p, gloss) => ({ ...p, ocean: { ...p.ocean, gloss } }),
  },
  spin: {
    label: "Spin",
    min: 0,
    max: 1,
    get: (p) => p.motion.spin,
    set: (p, spin) => ({ ...p, motion: { ...p.motion, spin } }),
  },
  tilt: {
    label: "Tilt",
    min: 0,
    max: 0.5,
    get: (p) => p.motion.tilt,
    set: (p, tilt) => ({ ...p, motion: { ...p.motion, tilt } }),
  },
};

/** Slider position as a whole percent of its range, as shown next to the slider. */
export function sliderPercent(spec: SliderSpec, value: number): number {
  return Math.round(((value - spec.min) / (spec.max - spec.min)) * 100);
}

export function fromPercent(spec: SliderSpec, percent: number): number {
  return spec.min + (percent / 100) * (spec.max - spec.min);
}

/** A biome's preset with its brand palette, keeping this world's seed and motion. */
export function applyPreset(params: WorldParams, biome: Biome): WorldParams {
  return normalizeParams({ ...presetParams(biome, params.seed), motion: params.motion });
}

export function applyPalette(params: WorldParams, paletteId: string): WorldParams {
  const palette = findPalette(paletteId);
  if (palette === undefined) return params;
  return normalizeParams({
    ...params,
    palette: { id: palette.id, stops: [...palette.stops] },
    ocean: { ...params.ocean, color: palette.ocean },
    atmosphere: { ...params.atmosphere, color: palette.atmosphere },
    clouds: { ...params.clouds, color: palette.clouds },
  });
}

export type ColorSlot =
  "stop0" | "stop1" | "stop2" | "stop3" | "stop4" | "ocean" | "air" | "clouds";

export function colorAt(params: WorldParams, slot: ColorSlot): string {
  switch (slot) {
    case "ocean":
      return params.ocean.color;
    case "air":
      return params.atmosphere.color;
    case "clouds":
      return params.clouds.color;
    default:
      return params.palette.stops[Number(slot.slice(4))] ?? params.ocean.color;
  }
}

export interface ColorEdit {
  params: WorldParams;
  /** True when the color was moved into the safe range (ADR-009). */
  adjusted: boolean;
}

/** A custom color (advanced mode). It is clamped, and the palette becomes "custom". */
export function applyColor(params: WorldParams, slot: ColorSlot, raw: string): ColorEdit {
  const hex = raw.toLowerCase();
  const color = clampColor(hex);
  const adjusted = color !== hex;
  switch (slot) {
    case "ocean":
      return { adjusted, params: { ...params, ocean: { ...params.ocean, color } } };
    case "air":
      return { adjusted, params: { ...params, atmosphere: { ...params.atmosphere, color } } };
    case "clouds":
      return { adjusted, params: { ...params, clouds: { ...params.clouds, color } } };
    default: {
      const index = Number(slot.slice(4));
      const stops = params.palette.stops.map((stop, i) => (i === index ? color : stop));
      return { adjusted, params: { ...params, palette: { id: "custom", stops } } };
    }
  }
}

/** A whole new world from a fresh seed. Motion stays; the name rolls unless it was typed. */
export function randomize(world: CreatorWorld, seed = randomSeed()): CreatorWorld {
  const params = normalizeParams({ ...randomParams(seed), motion: world.params.motion });
  return {
    params,
    nameEdited: world.nameEdited,
    name: world.nameEdited ? world.name : randomWorldName(seed),
  };
}

/** The world a new visitor starts from: a random preset, already named (SPEC §2.2). */
export function freshWorld(seed = randomSeed()): CreatorWorld {
  return {
    params: normalizeParams(randomParams(seed)),
    name: randomWorldName(seed),
    nameEdited: false,
  };
}
