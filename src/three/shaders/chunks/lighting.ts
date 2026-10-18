// Stylized diorama lighting (05 art direction): a large warm key, a cool fill at a third of its
// energy and a soft ambient floor so nothing goes hard black.
export const lightingChunk = /* glsl */ `
uniform vec3 uKeyDir;
uniform vec3 uKey;
uniform vec3 uFillDir;
uniform vec3 uFill;

vec3 softLight(vec3 n) {
  float key = clamp((dot(n, uKeyDir) + 0.1) / 1.1, 0.0, 1.0);
  float fill = max(dot(n, uFillDir), 0.0);
  vec3 ambient = mix(uFill, uKey, 0.4) * 0.14;
  return uKey * key * 1.1 + uFill * fill + ambient;
}

// 1 on the lit side, 0 deep in the night side.
float daylight(vec3 n) {
  return smoothstep(-0.2, 0.15, dot(n, uKeyDir));
}
`;

// Cloud cover shared by the cloud shell and the soft shadow it fakes on the surface.
export const cloudChunk = /* glsl */ `
uniform float uCoverage;
uniform float uCloudAngle;

vec3 rotateY(vec3 v, float a) {
  float c = cos(a);
  float s = sin(a);
  return vec3(c * v.x + s * v.z, v.y, -s * v.x + c * v.z);
}

float cloudCover(vec3 dir) {
  if (uCoverage < 0.001) return 0.0;
  vec3 q = rotateY(dir, uCloudAngle) * 3.2 + uSeedOffset.zxy;
  float n = 0.5 + 0.5 * (snoise(q) * 0.62 + snoise(q * 2.3 + 4.1) * 0.38);
  float threshold = 1.0 - uCoverage * 0.5;
  return smoothstep(threshold, threshold + 0.06, n);
}
`;
