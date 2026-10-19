import { lightingChunk } from "./chunks/lighting";

// The universe's far and mid LOD (SPEC §8.4, ADR-024, 05 visual language): soft round dots, no
// spikes or twinkle. Births scale in from nothing with one brief, gentle flash.

/**
 * Slot dust and far worlds, one point per slot. aColorA is the core, aColorB the halo. aState
 * is 0 for a hidden slot, 1 for an unknown slot (dim dust) and 2 for a loaded world.
 */
export const dustVertex = /* glsl */ `
precision highp float;

attribute vec3 aColorA;
attribute vec3 aColorB;
attribute float aSize;
attribute float aState;
attribute float aBirth;

uniform float uTime;
uniform float uPixelRatio;
uniform float uScale;
uniform float uBirthSeconds;
uniform float uFlash;
uniform float uNearFade;
uniform float uFarFade;
uniform vec3 uDust;

varying vec3 vCore;
varying vec3 vHalo;
varying float vAlpha;

void main() {
  vec4 view = modelViewMatrix * vec4(position, 1.0);
  float distance = -view.z;
  float age = max(uTime - aBirth, 0.0);
  float grow = smoothstep(0.0, uBirthSeconds, age);
  float flash = uFlash * exp(-age * 2.5) * step(age, 3.0);

  float known = step(0.5, aState);
  // Loaded worlds only stand out from the dust up close, so sector edges never show from afar.
  float loaded = step(1.5, aState) * (1.0 - smoothstep(uFarFade * 0.4, uFarFade, distance));
  // Dust stays tiny and dim; worlds glow by level. Close worlds hand over to the mid spheres.
  float pixels = mix(1.6, aSize, loaded) * uScale / max(distance, 1.0);
  pixels = clamp(pixels, 1.4, mix(2.4, 14.0, loaded)) * (grow + flash * 0.6);
  float nearFade = mix(1.0, smoothstep(uNearFade * 0.6, uNearFade, distance), step(1.5, aState));

  gl_PointSize = pixels * uPixelRatio;
  gl_Position = projectionMatrix * view;
  vCore = mix(uDust, aColorA, loaded) + flash;
  vHalo = mix(uDust, aColorB, loaded);
  vAlpha = known * mix(0.55, 1.0, loaded) * nearFade * min(grow + flash, 1.0);
}
`;

export const dustFragment = /* glsl */ `
precision highp float;

varying vec3 vCore;
varying vec3 vHalo;
varying float vAlpha;

void main() {
  float r = length(gl_PointCoord - 0.5) * 2.0;
  if (r > 1.0 || vAlpha < 0.01) discard;
  float core = 1.0 - smoothstep(0.0, 0.45, r);
  float halo = 1.0 - smoothstep(0.2, 1.0, r);
  vec3 color = mix(vHalo, vCore, core);
  gl_FragColor = vec4(color, (core + halo * 0.55) * vAlpha);
  #include <colorspace_fragment>
}
`;

/** Mid LOD: low-detail instanced spheres in two palette colors, lit like the planets. */
export const midVertex = /* glsl */ `
precision highp float;

attribute vec3 aColorA;
attribute vec3 aColorB;

varying vec3 vNormalW;
varying vec3 vViewDir;
varying vec3 vColorA;
varying vec3 vColorB;
varying float vHeight;

void main() {
  vec4 world = modelMatrix * instanceMatrix * vec4(position, 1.0);
  vNormalW = normalize(mat3(modelMatrix * instanceMatrix) * normal);
  vViewDir = normalize(cameraPosition - world.xyz);
  vColorA = aColorA;
  vColorB = aColorB;
  vHeight = position.y;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

export const midFragment = /* glsl */ `
precision highp float;

${lightingChunk}

varying vec3 vNormalW;
varying vec3 vViewDir;
varying vec3 vColorA;
varying vec3 vColorB;
varying float vHeight;

void main() {
  vec3 n = normalize(vNormalW);
  // Land color through the middle, atmosphere color toward the poles and rim.
  vec3 base = mix(vColorA, vColorB, smoothstep(0.35, 0.95, abs(vHeight)) * 0.6);
  float rim = pow(1.0 - max(dot(n, normalize(vViewDir)), 0.0), 2.5);
  vec3 color = base * softLight(n) + vColorB * rim * 0.45 * daylight(n);
  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
}
`;
