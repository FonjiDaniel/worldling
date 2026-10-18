import { cloudChunk, lightingChunk } from "./chunks/lighting";
import { simplexNoise } from "./chunks/noise";

// Clouds, atmosphere and aurora shells (SPEC §8.3). All share one simple vertex shader.

export const shellVertex = /* glsl */ `
precision highp float;

varying vec3 vDir;
varying vec3 vNormalW;
varying vec3 vNormalV;
varying vec3 vPosW;

void main() {
  vDir = normalize(position);
  vec4 world = modelMatrix * vec4(position, 1.0);
  vPosW = world.xyz;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  vNormalV = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const shellVaryings = /* glsl */ `
varying vec3 vDir;
varying vec3 vNormalW;
varying vec3 vNormalV;
varying vec3 vPosW;
`;

export const cloudsFragment = /* glsl */ `
precision highp float;
${simplexNoise}
uniform vec3 uSeedOffset;
${lightingChunk}
${cloudChunk}
${shellVaryings}

uniform vec3 uClouds;

void main() {
  float cover = cloudCover(vDir);
  if (cover < 0.01) discard;
  vec3 n = normalize(vNormalW);
  vec3 color = uClouds * (softLight(n) * 0.9 + 0.1);
  gl_FragColor = vec4(color, cover * 0.92);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

/** Back-face glow shell. Its radius sets the 0.5 limb constant below (1 / 1.16 planet radius). */
export const ATMOSPHERE_RADIUS = 1.16;

export const atmosphereFragment = /* glsl */ `
precision highp float;
${lightingChunk}
${shellVaryings}

uniform vec3 uAtmosphere;
uniform float uDensity;
uniform float uHalo;
uniform vec3 uHaloColor;
uniform float uGlow;

void main() {
  float limb = clamp(-vNormalV.z / 0.5, 0.0, 1.0);
  float day = mix(0.2, 1.0, smoothstep(-0.4, 0.5, dot(normalize(vNormalW), uKeyDir)));
  float glow = pow(limb, 3.0) * uDensity * (0.3 + uGlow * 0.08) * day;
  vec3 color = uAtmosphere * glow + uHaloColor * pow(limb, 2.2) * uHalo * 0.1;
  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
}
`;

export const auroraFragment = /* glsl */ `
precision highp float;
${simplexNoise}
${lightingChunk}
${shellVaryings}

uniform vec3 uAuroraColor;
uniform float uTime;

void main() {
  float lat = abs(vDir.y);
  float band = smoothstep(0.74, 0.82, lat) * (1.0 - smoothstep(0.88, 0.96, lat));
  float around = atan(vDir.z, vDir.x);
  float curtain = 0.5 + 0.5 * snoise(vec3(around * 3.0, lat * 9.0, uTime * 0.04));
  float night = 1.0 - daylight(normalize(vNormalW));
  float strength = band * curtain * (0.25 + 0.75 * night) * 0.55;
  gl_FragColor = vec4(uAuroraColor * strength, 1.0);
  #include <colorspace_fragment>
}
`;
