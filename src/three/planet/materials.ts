import {
  AdditiveBlending,
  BackSide,
  type BufferGeometry,
  IcosahedronGeometry,
  type IUniform,
  ShaderMaterial,
  Vector3,
} from "three";

import { oceanFragment, oceanVertex } from "../shaders/ocean";
import { fireflyFragment, fireflyVertex, moonFragment, moonVertex } from "../shaders/orbitals";
import { atmosphereFragment, auroraFragment, cloudsFragment, shellVertex } from "../shaders/sky";
import { surfaceFragment, surfaceVertex } from "../shaders/surface";
import type { PlanetUniformData, Vec3 } from "./uniforms";

// One uniform bag per planet, shared by every layer. Updates mutate .value only (SPEC §8.10).

const v3 = () => ({ value: new Vector3() });
const num = (value = 0) => ({ value });

export function createPlanetUniforms() {
  return {
    uSeedOffset: v3(),
    uScale: num(1),
    uGain: num(0.5),
    uAmplitude: num(0),
    uSeaLevel: num(0.5),
    uBiome: num(0),
    uStops: { value: [new Vector3(), new Vector3(), new Vector3(), new Vector3(), new Vector3()] },
    uVegetation: v3(),
    uVegetationOn: num(),
    uOcean: v3(),
    uShallow: v3(),
    uGloss: num(),
    uOceanEmissive: num(),
    uGlints: num(),
    uAtmosphere: v3(),
    uDensity: num(),
    uClouds: v3(),
    uCoverage: num(),
    uCloudAngle: num(),
    uNightColor: v3(),
    uNightLights: num(),
    uAuroraColor: v3(),
    uHalo: num(),
    uHaloColor: v3(),
    uFireflyColor: v3(),
    uMoonColor: v3(),
    uKeyDir: v3(),
    uKey: v3(),
    uFillDir: v3(),
    uFill: v3(),
    uGlow: num(),
    uTime: num(),
    uPixelRatio: num(1),
  } satisfies Record<string, IUniform>;
}

export type PlanetUniforms = ReturnType<typeof createPlanetUniforms>;

function set(target: { value: Vector3 }, [x, y, z]: Vec3): void {
  target.value.set(x, y, z);
}

export interface RenderOptions {
  /** Tier 3 soft glow on emissive accents, in place of a bloom pass (ADR-020). */
  glow: number;
  pixelRatio: number;
}

export function applyUniforms(
  u: PlanetUniforms,
  data: PlanetUniformData,
  { glow, pixelRatio }: RenderOptions,
): void {
  set(u.uSeedOffset, data.seedOffset);
  u.uScale.value = data.scale;
  u.uGain.value = data.gain;
  u.uAmplitude.value = data.amplitude;
  u.uSeaLevel.value = data.seaLevel;
  u.uBiome.value = data.biome;
  data.stops.forEach((stop, i) => {
    u.uStops.value[i]?.set(...stop);
  });
  set(u.uVegetation, data.vegetationColor);
  u.uVegetationOn.value = data.features.vegetation;
  set(u.uOcean, data.ocean);
  set(u.uShallow, data.oceanShallow);
  u.uGloss.value = data.gloss;
  u.uOceanEmissive.value = data.oceanEmissive;
  u.uGlints.value = data.features.glints;
  set(u.uAtmosphere, data.atmosphere);
  u.uDensity.value = data.density;
  set(u.uClouds, data.clouds);
  u.uCoverage.value = data.coverage;
  set(u.uNightColor, data.art.nightLights);
  u.uNightLights.value = data.features.nightLights;
  set(u.uAuroraColor, data.art.aurora);
  u.uHalo.value = data.features.halo;
  set(u.uHaloColor, data.art.halo);
  set(u.uFireflyColor, data.art.firefly);
  set(u.uMoonColor, data.art.moon);
  set(u.uKeyDir, data.light.keyDir);
  set(u.uKey, data.light.key);
  set(u.uFillDir, data.light.fillDir);
  set(u.uFill, data.light.fill);
  u.uGlow.value = glow;
  u.uPixelRatio.value = pixelRatio;
}

/**
 * Per-frame update: world time drives clouds, lava, glints, aurora and fireflies. `amplitude`
 * is the terrain height this frame, lowered while the world re-forms.
 */
export function tickUniforms(
  u: PlanetUniforms,
  time: number,
  cloudDrift: number,
  amplitude: number,
): void {
  u.uTime.value = time;
  u.uCloudAngle.value = time * cloudDrift;
  u.uAmplitude.value = amplitude;
}

export interface PlanetMaterials {
  surface: ShaderMaterial;
  ocean: ShaderMaterial;
  clouds: ShaderMaterial;
  atmosphere: ShaderMaterial;
  aurora: ShaderMaterial;
  moon: ShaderMaterial;
  fireflies: ShaderMaterial;
}

/** Materials for one planet at one tier. OCTAVES is compiled in, so a tier change rebuilds. */
export function createPlanetMaterials(uniforms: PlanetUniforms, octaves: number): PlanetMaterials {
  const defines = { OCTAVES: octaves };
  const glow = { transparent: true, depthWrite: false, blending: AdditiveBlending };
  const make = (vertexShader: string, fragmentShader: string, extra = {}) =>
    new ShaderMaterial({ uniforms, defines, vertexShader, fragmentShader, ...extra });
  return {
    surface: make(surfaceVertex, surfaceFragment),
    ocean: make(oceanVertex, oceanFragment, { transparent: true }),
    clouds: make(shellVertex, cloudsFragment, { transparent: true, depthWrite: false }),
    atmosphere: make(shellVertex, atmosphereFragment, { ...glow, side: BackSide }),
    aurora: make(shellVertex, auroraFragment, glow),
    moon: make(moonVertex, moonFragment),
    fireflies: make(fireflyVertex, fireflyFragment, glow),
  };
}

export function disposeMaterials(materials: PlanetMaterials): void {
  const { surface, ocean, clouds, atmosphere, aurora, moon, fireflies } = materials;
  for (const material of [surface, ocean, clouds, atmosphere, aurora, moon, fireflies]) {
    material.dispose();
  }
}

const spheres = new Map<number, BufferGeometry>();

/** Shared unit spheres, created once per detail and kept for the app's lifetime (SPEC §8.10). */
export function sharedSphere(detail: number): BufferGeometry {
  let geometry = spheres.get(detail);
  if (!geometry) {
    geometry = new IcosahedronGeometry(1, detail);
    spheres.set(detail, geometry);
  }
  return geometry;
}
