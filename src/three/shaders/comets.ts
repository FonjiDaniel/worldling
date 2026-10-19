// Comet streaks (SPEC §2.2): GPU-only motion, a bright head and a tail that thins and fades.

export const cometVertex = /* glsl */ `
precision highp float;

attribute vec4 aOrbit; // radius, phase, inclination, speed
attribute float aTrail; // 0 at the head, 1 at the tail end

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
  float head = 1.0 - aTrail;
  vFade = head * head;
  gl_PointSize = (10.0 + 22.0 * head) * uPixelRatio / -view.z;
  gl_Position = projectionMatrix * view;
}
`;

export const cometFragment = /* glsl */ `
precision highp float;

uniform vec3 uCometColor;

varying float vFade;

void main() {
  float d = length(gl_PointCoord - 0.5);
  float glow = smoothstep(0.5, 0.0, d);
  gl_FragColor = vec4(uCometColor * glow * glow * vFade * 0.9, 1.0);
  #include <colorspace_fragment>
}
`;
