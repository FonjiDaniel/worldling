import { describe, expect, it } from "vitest";

import { cycleIndex, galaxyAction } from "./keyboard";

describe("galaxyAction", () => {
  it("maps the §2.5 keys", () => {
    expect(galaxyAction("ArrowUp", false)).toEqual({ kind: "pan", right: 0, forward: 1 });
    expect(galaxyAction("ArrowLeft", false)).toEqual({ kind: "pan", right: -1, forward: 0 });
    expect(galaxyAction("+", false)).toEqual({ kind: "zoom", direction: 1 });
    expect(galaxyAction("-", false)).toEqual({ kind: "zoom", direction: -1 });
    expect(galaxyAction("Tab", true)).toEqual({ kind: "cycle", step: -1 });
    expect(galaxyAction("Enter", false)).toEqual({ kind: "visit" });
    expect(galaxyAction("a", false)).toBeNull();
  });
});

describe("cycleIndex", () => {
  it("walks forward and lets focus leave after the last world", () => {
    expect(cycleIndex(null, 1, 3)).toBe(0);
    expect(cycleIndex(1, 1, 3)).toBe(2);
    expect(cycleIndex(2, 1, 3)).toBeNull();
  });

  it("walks backward from the end and leaves before the first", () => {
    expect(cycleIndex(null, -1, 3)).toBe(2);
    expect(cycleIndex(0, -1, 3)).toBeNull();
    expect(cycleIndex(null, 1, 0)).toBeNull();
  });
});
