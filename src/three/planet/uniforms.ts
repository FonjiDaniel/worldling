import { unlocksFor } from "@convex/shared/bloom";
import { hexToLinear, hexToRgb, hslToRgb, rgbToHsl, srgbToLinear } from "@convex/shared/color";
import { hash01 } from "@convex/shared/random";
import { BIOMES, type WorldParams } from "@convex/shared/worldParams";

import { motion } from "@/lib/motion";

import type { ArtColors } from "../art";
import { type RenderTier, TIERS } from "../quality";

// Pure world params -> shader inputs (SPEC §8.3). Same input, same output, no three.js.

export type Vec3 = [number, number, number];

export interface PlanetUniformData {
  octaves: number;
  detail: number;
  seedOffset: Vec3;
  biome: number;
  scale: number;
  gain: number;
  amplitude: number;
  seaLevel: number;
  stops: [Vec3, Vec3, Vec3, Vec3, Vec3];
  vegetationColor: Vec3;
  ocean: Vec3;
  oceanShallow: Vec3;
  gloss: number;
  /** Lava glow for volcanic seas, 0 elsewhere. */
  oceanEmissive: number;
  atmosphere: Vec3;
  density: number;
  clouds: Vec3;
  coverage: number;
  /** Radians per second the clouds slide over the surface. 0 until level 2. */
  cloudDrift: number;
  /** Radians per second of planet spin. */
  spinRate: number;
  tilt: number;
  orbitRate: number;
  features: {
    glints: number;
    vegetation: number;
    nightLights: number;
    aurora: number;
    halo: number;
  };
  moons: number;
  fireflies: boolean;
  light: { keyDir: Vec3; key: Vec3; fill: Vec3; fillDir: Vec3 };
  art: { nightLights: Vec3; aurora: Vec3; halo: Vec3; firefly: Vec3; moon: Vec3 };
}

/** Warm key from the upper left, cool fill opposite at a third of its energy (05 art direction). */
const KEY_DIR = normalize([-0.62, 0.55, 0.56]);
const FILL_DIR = normalize([0.7, -0.25, 0.4]);
const FILL_ENERGY = 1 / 3;
const SEED_RANGE = 20;

function normalize([x, y, z]: Vec3): Vec3 {
  const length = Math.hypot(x, y, z) || 1;
  return [x / length, y / length, z / length];
}

function scaled([x, y, z]: Vec3, k: number): Vec3 {
  return [x * k, y * k, z * k];
}

/** A stable vec3 in [-SEED_RANGE, SEED_RANGE] so each seed samples its own noise region. */
export function seedOffset(seed: number): Vec3 {
  const axis = (i: number) => (hash01(seed * 3 + i) * 2 - 1) * SEED_RANGE;
  return [axis(0), axis(1), axis(2)];
}

/** Planet turn period: spin 0.5 is the 120s brand rotation, 0 is half speed, 1 double. */
export function spinPeriod(spin: number): number {
  return motion.duration.rotation * 2 ** (1 - 2 * spin);
}

function hslLinear(h: number, s: number, l: number): Vec3 {
  const [r, g, b] = hslToRgb({ h, s, l });
  return [srgbToLinear(r), srgbToLinear(g), srgbToLinear(b)];
}

/** Turquoise shallows for water-like seas: lighter, hue nudged toward cyan. */
export function shallowColor(oceanHex: string): Vec3 {
  const { h, s, l } = rgbToHsl(hexToRgb(oceanHex));
  const watery = h >= 150 && h <= 260;
  const hue = watery ? h + (178 - h) * 0.6 : h;
  return hslLinear(hue, Math.min(0.7, s + 0.08), Math.min(0.72, l + 0.3));
}

/** Lowland growth tint: a soft green from the midland stop; moss red and mint for odd biomes. */
export function vegetationColor(params: WorldParams): Vec3 {
  const { l } = rgbToHsl(hexToRgb(params.palette.stops[2] ?? params.ocean.color));
  const hue = params.biome === "volcanic" ? 12 : params.biome === "crystal" ? 160 : 100;
  return hslLinear(hue, 0.38, Math.min(0.42, Math.max(0.24, l * 0.8)));
}

export function paramsToUniforms(
  params: WorldParams,
  tier: RenderTier,
  level: number,
  art: ArtColors,
): PlanetUniformData {
  const unlocks = unlocksFor(level);
  const spinRate = (2 * Math.PI) / spinPeriod(params.motion.spin);
  const [s0, s1, s2, s3, s4] = params.palette.stops.map(hexToLinear);
  const flag = (on: boolean) => (on ? 1 : 0);
  return {
    octaves: TIERS[tier].octaves,
    detail: TIERS[tier].detail,
    seedOffset: seedOffset(params.seed),
    biome: BIOMES.indexOf(params.biome),
    scale: params.terrain.scale,
    gain: 0.3 + params.terrain.roughness * 0.25,
    amplitude: params.terrain.amplitude,
    seaLevel: params.terrain.seaLevel,
    stops: [s0 ?? [0, 0, 0], s1 ?? [0, 0, 0], s2 ?? [0, 0, 0], s3 ?? [0, 0, 0], s4 ?? [0, 0, 0]],
    vegetationColor: vegetationColor(params),
    ocean: hexToLinear(params.ocean.color),
    oceanShallow: shallowColor(params.ocean.color),
    gloss: params.ocean.gloss,
    oceanEmissive: params.biome === "volcanic" ? 1 : 0,
    atmosphere: hexToLinear(params.atmosphere.color),
    density: params.atmosphere.density,
    clouds: hexToLinear(params.clouds.color),
    coverage: params.clouds.coverage,
    cloudDrift: unlocks.cloudDrift ? spinRate * (0.15 + params.clouds.speed * 0.6) : 0,
    spinRate,
    tilt: params.motion.tilt,
    orbitRate: (2 * Math.PI) / motion.duration.orbit,
    features: {
      glints: flag(unlocks.glints),
      vegetation: flag(unlocks.vegetation),
      nightLights: flag(unlocks.nightLights),
      aurora: flag(unlocks.aurora),
      halo: flag(unlocks.halo),
    },
    moons: unlocks.moons,
    fireflies: unlocks.fireflies,
    light: sceneLight(art),
    art: {
      nightLights: hexToLinear(art.nightLights),
      aurora: hexToLinear(art.aurora),
      halo: hexToLinear(art.halo),
      firefly: hexToLinear(art.firefly),
      moon: hexToLinear(art.moon),
    },
  };
}

/** Key and fill light shared by planets and the universe's mid LOD spheres. */
export function sceneLight(art: ArtColors): PlanetUniformData["light"] {
  return {
    keyDir: KEY_DIR,
    key: hexToLinear(art.keyLight),
    fillDir: FILL_DIR,
    fill: scaled(hexToLinear(art.fillLight), FILL_ENERGY),
  };
}
