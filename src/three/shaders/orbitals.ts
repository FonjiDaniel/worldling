import { lightingChunk } from "./chunks/lighting";
import { simplexNoise } from "./chunks/noise";

// Moons and fireflies (SPEC §2.4 levels 6, 7, 9). Fireflies move entirely on the GPU.

export const moonVertex = /* glsl */ `
precision highp float;

varying vec3 vDir;
varying vec3 vNormalW;

void main() {
  vDir = normalize(position);
  vNormalW = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
}
`;

export const moonFragment = /* glsl */ `
precision highp float;
${simplexNoise}
${lightingChunk}

uniform vec3 uMoonColor;

varying vec3 vDir;
varying vec3 vNormalW;

void main() {
  float mottled = 1.0 + 0.12 * snoise(vDir * 3.0);
  gl_FragColor = vec4(uMoonColor * mottled * softLight(normalize(vNormalW)), 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

export const fireflyVertex = /* glsl */ `
precision highp float;

attribute vec4 aOrbit; // radius, phase, inclination, speed

uniform float uTime;
uniform float uPixelRatio;

varying float vFade;

void main() {
  float angle = aOrbit.y + uTime * aOrbit.w;
  vec3 p = vec3(cos(angle), 0.0, sin(angle)) * aOrbit.x;
  float c = cos(aOrbit.z);
  float s = sin(aOrbit.z);
  p = vec3(p.x, p.z * s, p.z * c);
  vec4 view = viewMatrix * modelMatrix * vec4(p, 1.0);
  vFade = 0.6 + 0.4 * sin(uTime * 1.3 + aOrbit.y * 7.0);
  gl_PointSize = 24.0 * uPixelRatio / -view.z;
  gl_Position = projectionMatrix * view;
}
`;

export const fireflyFragment = /* glsl */ `
precision highp float;

uniform vec3 uFireflyColor;

varying float vFade;

void main() {
  float d = length(gl_PointCoord - 0.5);
  float glow = smoothstep(0.5, 0.0, d);
  gl_FragColor = vec4(uFireflyColor * glow * glow * vFade * 0.6, 1.0);
  #include <colorspace_fragment>
}
`;
