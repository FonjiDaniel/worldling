import { beforeEach, describe, expect, it } from "vitest";

import { QUALITY_STORAGE_KEY } from "@/three/quality";

import { effectiveTier, motionRate, useExperience } from "./experience";

const initial = useExperience.getState();

beforeEach(() => {
  localStorage.clear();
  useExperience.setState(initial, true);
});

describe("experience store", () => {
  it("waits for detection, then follows it", () => {
    expect(effectiveTier(useExperience.getState())).toBeNull();
    useExperience.getState().setDetected(3, "test gpu");
    expect(effectiveTier(useExperience.getState())).toBe(3);
  });

  it("drops tiers on decline at most twice and never below 1", () => {
    useExperience.getState().setDetected(3, "test gpu");
    for (let i = 0; i < 5; i += 1) useExperience.getState().declineTier();
    expect(effectiveTier(useExperience.getState())).toBe(1);
    expect(useExperience.getState().tierChanges).toBe(2);
  });

  it("lets the user override and remembers it", () => {
    useExperience.getState().setDetected(3, "test gpu");
    useExperience.getState().setOverride(1);
    expect(effectiveTier(useExperience.getState())).toBe(1);
    expect(localStorage.getItem(QUALITY_STORAGE_KEY)).toBe("1");
    useExperience.getState().declineTier();
    expect(useExperience.getState().tierChanges).toBe(0);
    useExperience.getState().setOverride(null);
    expect(localStorage.getItem(QUALITY_STORAGE_KEY)).toBeNull();
  });

  it("falls back to tier 0 when WebGL fails or is missing", () => {
    useExperience.getState().setDetected(2, "test gpu");
    useExperience.getState().setWebgl("failed");
    expect(effectiveTier(useExperience.getState())).toBe(0);
    useExperience.setState({ webgl: "ok", detectedTier: 0, override: 3 });
    expect(effectiveTier(useExperience.getState())).toBe(0);
  });

  it("counts registered views", () => {
    const release = useExperience.getState().registerView();
    expect(useExperience.getState().views).toBe(1);
    release();
    expect(useExperience.getState().views).toBe(0);
  });

  it("slows ambient motion with reduced motion and stops it when paused", () => {
    expect(motionRate({ motionPaused: false, reducedMotion: false }, 0.35)).toBe(1);
    expect(motionRate({ motionPaused: false, reducedMotion: true }, 0.35)).toBe(0.35);
    expect(motionRate({ motionPaused: true, reducedMotion: true }, 0.35)).toBe(0);
  });
});
