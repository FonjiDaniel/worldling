import { simplexNoise } from "./noise";

// Terrain height shared by the surface and ocean shaders. Every layer
// samples the same function so coasts line up. OCTAVES is a #define set per quality tier.
export const terrainChunk = /* glsl */ `
${simplexNoise}

uniform vec3 uSeedOffset;
uniform float uScale;
uniform float uGain;
uniform float uSeaLevel;
uniform int uBiome;

float fbm(vec3 p) {
  float sum = 0.0;
  float amp = 0.5;
  float total = 0.0;
  for (int i = 0; i < OCTAVES; i++) {
    sum += amp * snoise(p);
    total += amp;
    p = p * 2.03 + vec3(17.1, 9.2, 31.7);
    amp *= uGain;
  }
  return sum / total;
}

// Verdant rivers: one winding channel carved below sea level.
float riverCut(vec3 dir) {
  if (uBiome != 1) return 0.0;
  float channel = 1.0 - abs(snoise(dir * 0.9 + uSeedOffset.yzx));
  return smoothstep(0.94, 0.975, channel) * 0.6;
}

// 0..1 height for a unit direction. Broad, rounded continents first, fine detail last.
float terrainHeight(vec3 dir) {
  vec3 p = dir * uScale + uSeedOffset;
  float h = 0.5 + 0.85 * fbm(p);
  // Desert dunes: soft ribbons across the lowlands.
  if (uBiome == 2) {
    float ribbon = sin(dot(dir, vec3(5.0, 2.0, 3.0)) * 4.0 + snoise(p * 2.0) * 2.5);
    h += 0.025 * ribbon * (1.0 - smoothstep(0.45, 0.7, h));
  }
  return clamp(h - riverCut(dir), 0.0, 1.0);
}

// Low-frequency shape for vertex displacement: a solid round base with broad landmarks, so
// silhouettes stay smooth while color and shading carry the detail.
float terrainShape(vec3 dir) {
  vec3 p = dir * uScale + uSeedOffset;
  float n = 0.5 * snoise(p) + 0.25 * snoise(p * 2.03 + vec3(17.1, 9.2, 31.7));
  return clamp(0.5 + 0.85 * n / 0.75, 0.0, 1.0);
}

// 0..1 land elevation above the sea, eased so hills stay rounded.
float landElevation(float h) {
  float e = clamp((h - uSeaLevel) / max(1.0 - uSeaLevel, 0.05), 0.0, 1.0);
  e = e * e * (3.0 - 2.0 * e) * 0.6 + e * 0.4;
  // Desert mesas: low dunes, then a short cliff up to flat-topped plateaus.
  if (uBiome == 2) {
    float mesa = smoothstep(0.62, 0.68, e);
    e = mix(e * 0.6, 0.8 + (e - 0.68) * 0.3, mesa);
  }
  return e;
}
`;
