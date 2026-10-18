import type { gsap as Gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";

// GSAP mirror of the motion tokens in src/styles/tokens.css (SPEC §3.5, ADR-018).
// Durations are seconds. Eases are the CSS cubic-bezier control points.
export const motion = {
  duration: {
    fast: 0.15,
    base: 0.24,
    slow: 0.6,
    press: 0.1,
    "panel-exit": 0.18,
    comet: 0.9,
    bloom: 1.2,
    drift: 16,
    rotation: 120,
    orbit: 90,
    reduced: 0.15,
    flight: 1.6,
  },
  ease: {
    out: [0.2, 0.8, 0.2, 1],
    "in-out": [0.45, 0, 0.55, 1],
    press: [0.4, 0, 1, 1],
    comet: [0.22, 0.61, 0.36, 1],
    soft: [0.37, 0, 0.63, 1],
  },
  // Reduced motion: a short fade, no travel, scale or camera roll.
  reduced: { duration: 0.15, ease: "out", travel: 0 },
} as const;

export type MotionEase = keyof typeof motion.ease;

// GSAP name for a token ease, e.g. gsap.to(el, { ease: easeName("out") }).
export function easeName(name: MotionEase): string {
  return `wl-${name}`;
}

// Registers every token ease as a CustomEase, once, before the first tween.
export function registerEases(gsap: typeof Gsap): void {
  gsap.registerPlugin(CustomEase);
  for (const [name, [x1, y1, x2, y2]] of Object.entries(motion.ease)) {
    CustomEase.create(`wl-${name}`, `M0,0 C${x1},${y1} ${x2},${y2} 1,1`);
  }
}
