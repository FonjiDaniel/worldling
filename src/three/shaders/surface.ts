import { cloudChunk, lightingChunk } from "./chunks/lighting";
import { terrainChunk } from "./chunks/terrain";
import { waterChunk } from "./chunks/water";

// Surface layer (SPEC §8.3): displaced sphere colored by elevation.

export const surfaceVertex = /* glsl */ `
precision highp float;
${terrainChunk}

uniform float uAmplitude;

varying vec3 vDir;
varying vec3 vNormalW;
varying vec3 vPosW;
varying float vHeight;
varying float vElev;
varying float vSlope;

vec3 surfacePoint(vec3 d) {
  float h = terrainShape(d);
  float lift = h >= uSeaLevel ? landElevation(h) : (h - uSeaLevel) * 0.4;
  return d * (1.0 + uAmplitude * lift);
}

void main() {
  vec3 d = normalize(position);
  vec3 p0 = surfacePoint(d);
  vec3 helper = abs(d.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
  vec3 t1 = normalize(cross(d, helper));
  vec3 t2 = cross(d, t1);
  const float eps = 0.004;
  vec3 p1 = surfacePoint(normalize(d + t1 * eps));
  vec3 p2 = surfacePoint(normalize(d + t2 * eps));
  vec3 n = normalize(cross(p1 - p0, p2 - p0));
  if (dot(n, d) < 0.0) n = -n;

  vHeight = terrainShape(d);
  vElev = landElevation(vHeight);
  vSlope = clamp(1.0 - dot(n, d), 0.0, 1.0);
  vDir = d;
  vec4 world = modelMatrix * vec4(p0, 1.0);
  vPosW = world.xyz;
  vNormalW = normalize(mat3(modelMatrix) * n);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

export const surfaceFragment = /* glsl */ `
precision highp float;
${terrainChunk}
${lightingChunk}
${cloudChunk}
${waterChunk}

uniform vec3 uStops[5];
uniform vec3 uVegetation;
uniform float uVegetationOn;
uniform vec3 uNightColor;
uniform float uNightLights;
uniform float uAmplitude;

varying vec3 vDir;
varying vec3 vNormalW;
varying vec3 vPosW;
varying float vHeight;
varying float vElev;
varying float vSlope;

vec3 palette(float e) {
  float x = clamp(e, 0.0, 1.0) * 4.0;
  vec3 c = mix(uStops[0], uStops[1], smoothstep(0.25, 0.75, x));
  c = mix(c, uStops[2], smoothstep(1.25, 1.75, x));
  c = mix(c, uStops[3], smoothstep(2.25, 2.75, x));
  return mix(c, uStops[4], smoothstep(3.25, 3.75, x));
}

// Screen-space bump from the per-pixel height (three.js perturbNormalArb).
vec3 bump(vec3 n, float height) {
  vec3 dpdx = dFdx(vPosW);
  vec3 dpdy = dFdy(vPosW);
  vec3 r1 = cross(dpdy, n);
  vec3 r2 = cross(n, dpdx);
  float det = dot(dpdx, r1);
  vec3 grad = sign(det) * (dFdx(height) * r1 + dFdy(height) * r2);
  return normalize(abs(det) * n - grad);
}

void main() {
  vec3 dir = normalize(vDir);
  float h = terrainHeight(dir);
  float e = landElevation(h);
  bool land = h >= uSeaLevel;
  vec3 viewDir = normalize(cameraPosition - vPosW);
  // Bump from the uncarved height so river banks don't alias.
  float relief = landElevation(min(h + riverCut(dir), 1.0));
  vec3 n = bump(normalize(vNormalW), uAmplitude * relief * 0.5);

  vec3 albedo = land ? palette(e) : uStops[0] * 0.8;
  // Broad painted variation, never noisy.
  albedo *= 1.0 + 0.06 * snoise(dir * 4.0 + uSeedOffset * 0.5);

  float rockiness = uBiome == 1 || uBiome == 3 ? 0.35 : 1.0;
  float rock = smoothstep(0.06, 0.18, vSlope) * step(0.02, e) * rockiness;
  albedo = mix(albedo, uStops[3] * 0.85, rock * 0.5);

  vec3 emissive = vec3(0.0);
  if (uBiome == 2) {
    // Mesas: lit flat tops, a darker cliff band where the plateau steps up.
    float raw = clamp((h - uSeaLevel) / max(1.0 - uSeaLevel, 0.05), 0.0, 1.0);
    raw = raw * raw * (3.0 - 2.0 * raw) * 0.6 + raw * 0.4;
    float top = smoothstep(0.62, 0.68, raw);
    float cliff = top * (1.0 - top) * 4.0;
    albedo = mix(albedo, uStops[3], top);
    albedo = mix(albedo, uStops[4] * 0.8, cliff * 0.8);
    float ribbon = sin(dot(dir, vec3(5.0, 2.0, 3.0)) * 4.0 + snoise(dir * uScale * 2.0 + uSeedOffset) * 2.5);
    albedo *= 1.0 + 0.1 * ribbon * (1.0 - smoothstep(0.4, 0.6, e));
  } else if (uBiome == 3) {
    float cap = smoothstep(0.62, 0.74, abs(dir.y) + snoise(dir * 3.0 + uSeedOffset) * 0.08);
    albedo = mix(albedo, uStops[4], cap);
  } else if (uBiome == 4) {
    // A few long, contained lava seams through the lowlands.
    float ridge = 1.0 - abs(snoise(dir * 1.6 + uSeedOffset.zyx));
    float region = smoothstep(0.1, 0.4, snoise(dir * 1.1 + uSeedOffset));
    float seam = smoothstep(0.94, 0.985, ridge) * region * (1.0 - smoothstep(0.4, 0.75, e));
    albedo = mix(albedo, uOcean * 0.4, seam);
    emissive += uOcean * seam * (1.2 + uGlow * 0.5);
  } else if (uBiome == 5) {
    vec3 facet = normalize(cross(dFdx(vPosW), dFdy(vPosW)));
    float sparkle = pow(max(dot(reflect(-uKeyDir, facet), viewDir), 0.0), 16.0);
    albedo += uStops[4] * sparkle * 0.35 * smoothstep(0.45, 0.8, e);
  }

  if (uVegetationOn > 0.5) {
    float growth = smoothstep(-0.1, 0.3, snoise(dir * uScale * 3.0 + 7.0));
    // Deserts only green up around their oases.
    float reach = uBiome == 2 ? 0.06 : uBiome == 3 ? 0.2 : 0.45;
    float lowland = step(0.01, e) * (1.0 - smoothstep(reach * 0.6, reach, e)) * (1.0 - rock);
    albedo = mix(albedo, uVegetation, growth * lowland * 0.65);
  }

  albedo *= 1.0 - 0.25 * cloudCover(dir);
  float crease = mix(0.8, 1.0, smoothstep(0.0, 0.25, e)) * (1.0 - rock * 0.15);
  vec3 color = albedo * softLight(n) * crease + emissive;
  // Rivers and lakes above the ocean sphere: shade them as water here.
  if (!land) {
    vec4 water = shadeWater(dir, h, normalize(vNormalW), viewDir);
    color = mix(color, water.rgb, water.a);
  }

  if (uNightLights > 0.5 && land) {
    float cluster = smoothstep(0.15, 0.5, snoise(dir * 5.0 + uSeedOffset.yzx));
    float speck = smoothstep(0.6, 0.85, snoise(dir * 70.0));
    float habitable = step(0.02, e) * (1.0 - smoothstep(0.45, 0.6, e));
    color += uNightColor * cluster * speck * habitable * (1.0 - daylight(n)) * 1.4;
  }

  gl_FragColor = vec4(color, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;
