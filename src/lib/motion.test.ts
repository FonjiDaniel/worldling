import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { motion } from "./motion";

const tokens = readFileSync("src/styles/tokens.css", "utf8");

function cssDurationSeconds(name: string): number {
  const match = new RegExp(`--duration-${name}:\\s*(\\d+)ms`).exec(tokens);
  if (!match?.[1]) throw new Error(`Missing --duration-${name} in tokens.css`);
  return Number(match[1]) / 1000;
}

describe("motion tokens", () => {
  it.each(Object.entries(motion.duration))("GSAP %s matches the CSS token", (name, seconds) => {
    expect(cssDurationSeconds(name)).toBe(seconds);
  });
});
