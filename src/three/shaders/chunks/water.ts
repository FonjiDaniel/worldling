// Water shading shared by the ocean sphere and inland water drawn by the surface (rivers and
// lakes that sit above the ocean geometry). Needs terrainChunk and lightingChunk first.
export const waterChunk = /* glsl */ `
uniform vec3 uOcean;
uniform vec3 uShallow;
uniform vec3 uClouds;
uniform vec3 uAtmosphere;
uniform float uGloss;
uniform float uOceanEmissive;
uniform float uGlints;
uniform float uGlow;
uniform float uTime;

// Color and opacity of water over terrain height h. Volcanic seas are glowing lava.
vec4 shadeWater(vec3 dir, float h, vec3 n, vec3 viewDir) {
  float depth = clamp((uSeaLevel - h) / 0.28, 0.0, 1.0);
  if (uOceanEmissive > 0.5) {
    float flow = snoise(dir * 7.0 + vec3(0.0, uTime * 0.02, 0.0));
    vec3 crust = uOcean * 0.18;
    vec3 core = uOcean * uOcean * (1.6 + uGlow * 0.4);
    vec3 lava = mix(crust, core, smoothstep(-0.4, 0.5, flow) * (0.5 + depth * 0.5));
    return vec4(lava + crust * softLight(n) * 0.5, 1.0);
  }

  #if OCTAVES > 3
  vec3 q = dir * 22.0 + vec3(uTime * 0.03);
  n = normalize(n + 0.025 * vec3(snoise(q), snoise(q + 17.0), snoise(q + 31.0)));
  #endif

  vec3 water = mix(uShallow, uOcean, smoothstep(0.12, 0.6, depth));
  water = mix(water, uOcean * 0.7, smoothstep(0.7, 1.0, depth));
  float shore = 1.0 - smoothstep(0.0, 0.07, depth);
  float foam = shore * smoothstep(0.1, 0.6, snoise(dir * 38.0 + vec3(uTime * 0.02)));
  water = mix(water, uClouds, foam * 0.45);

  vec3 halfDir = normalize(uKeyDir + viewDir);
  float spec = pow(max(dot(n, halfDir), 0.0), mix(24.0, 140.0, uGloss)) * uGloss * 0.45;
  if (uGlints > 0.5) {
    float sparkle = smoothstep(0.78, 0.95, snoise(dir * 85.0 + vec3(uTime * 0.15)));
    spec += sparkle * pow(max(dot(n, halfDir), 0.0), 8.0) * 0.6;
  }
  float fresnel = pow(1.0 - max(dot(n, viewDir), 0.0), 4.0);
  vec3 color = water * softLight(n) + uKey * spec;
  color = mix(color, uAtmosphere * softLight(n), fresnel * 0.25);
  return vec4(color, mix(0.72, 1.0, smoothstep(0.0, 0.5, depth)));
}
`;
