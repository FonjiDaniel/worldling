// Quiet space behind every view (05 visual language): Void base, one or two nebula tints at 8%
// or less, sparse static round stars. Mirrors --space-backdrop so the canvas mount is seamless.

export const backdropVertex = /* glsl */ `
precision highp float;

void main() {
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

export const backdropFragment = /* glsl */ `
precision highp float;

uniform vec2 uResolution;
uniform float uPixelRatio;
uniform vec3 uSpace;
uniform vec3 uNebula;
uniform vec3 uAurora;
uniform vec3 uStar;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec3 color = uSpace;
  float nebula = 1.0 - smoothstep(0.0, 0.6, distance(uv * vec2(1.0, 0.75), vec2(0.2, 0.75)));
  float aurora = 1.0 - smoothstep(0.0, 0.55, distance(uv * vec2(1.0, 0.75), vec2(0.9, 0.0)));
  color = mix(color, uNebula, nebula * 0.08);
  color = mix(color, uAurora, aurora * 0.06);

  // About 30 stars per megapixel: one star in most 180 css-pixel cells.
  vec2 css = gl_FragCoord.xy / uPixelRatio;
  vec2 cell = floor(css / 180.0);
  float pick = hash(cell);
  if (pick < 0.95) {
    vec2 center = (cell + vec2(hash(cell + 1.7), hash(cell + 3.1))) * 180.0;
    float radius = mix(0.6, 1.5, hash(cell + 5.3));
    float alpha = mix(0.24, 0.55, hash(cell + 7.9));
    float star = 1.0 - smoothstep(radius - 0.5, radius + 0.5, distance(css, center));
    color = mix(color, uStar, star * alpha);
  }
  // Colors are already sRGB, so no output conversion.
  gl_FragColor = vec4(color, 1.0);
}
`;
