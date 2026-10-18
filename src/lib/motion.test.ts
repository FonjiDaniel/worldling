import { readFileSync } from "node:fs";

import { gsap } from "gsap";
import { describe, expect, it } from "vitest";

import { easeName, motion, registerEases } from "./motion";

const tokens = readFileSync("src/styles/tokens.css", "utf8");

function cssDurationSeconds(name: string): number {
  const match = new RegExp(`--duration-${name}:\\s*(\\d+)ms`).exec(tokens);
  if (!match?.[1]) throw new Error(`Missing --duration-${name} in tokens.css`);
  return Number(match[1]) / 1000;
}

function cssEase(name: string): number[] {
  const match = new RegExp(`--ease-${name}:\\s*cubic-bezier\\(([^)]+)\\)`).exec(tokens);
  if (!match?.[1]) throw new Error(`Missing --ease-${name} in tokens.css`);
  return match[1].split(",").map(Number);
}

describe("motion tokens", () => {
  it.each(Object.entries(motion.duration))("GSAP %s matches the CSS token", (name, seconds) => {
    expect(cssDurationSeconds(name)).toBe(seconds);
  });

  it.each(Object.entries(motion.ease))("GSAP ease %s matches the CSS token", (name, points) => {
    expect(cssEase(name)).toEqual(points);
  });

  it("registers every ease with GSAP", () => {
    registerEases(gsap);
    for (const name of Object.keys(motion.ease) as (keyof typeof motion.ease)[]) {
      const ease = gsap.parseEase(easeName(name));
      expect(ease(0)).toBeCloseTo(0);
      expect(ease(1)).toBeCloseTo(1);
    }
  });

  it("keeps the reduced fade in step with the token", () => {
    expect(cssDurationSeconds("reduced")).toBe(motion.reduced.duration);
  });
});
