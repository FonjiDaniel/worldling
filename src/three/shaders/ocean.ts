import { lightingChunk } from "./chunks/lighting";
import { terrainChunk } from "./chunks/terrain";
import { waterChunk } from "./chunks/water";

// Ocean layer (SPEC §8.3): sphere at sea level, depth-tinted shallows, fresnel and a soft sun
// highlight. Samples the terrain height per pixel so coastlines stay crisp. Volcanic seas glow.

export const oceanVertex = /* glsl */ `
precision highp float;

varying vec3 vDir;
varying vec3 vNormalW;
varying vec3 vPosW;

void main() {
  vDir = normalize(position);
  vec4 world = modelMatrix * vec4(position, 1.0);
  vPosW = world.xyz;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

export const oceanFragment = /* glsl */ `
precision highp float;
${terrainChunk}
${lightingChunk}
${waterChunk}

varying vec3 vDir;
varying vec3 vNormalW;
varying vec3 vPosW;

void main() {
  vec3 dir = normalize(vDir);
  float h = terrainHeight(dir);
  if (h > uSeaLevel) discard;
  vec3 viewDir = normalize(cameraPosition - vPosW);
  gl_FragColor = shadeWater(dir, h, normalize(vNormalW), viewDir);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;
