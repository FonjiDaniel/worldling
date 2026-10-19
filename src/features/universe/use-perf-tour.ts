"use client";

import { useEffect } from "react";

import { slotToPosition } from "@convex/shared/galaxy";

import { useExperience } from "@/stores/experience";
import { useUniverse } from "@/three/universe/store";

// Performance tour (`/universe?perf=1`, only where dev routes are on): StatsGl on, the probe mounted, and the camera
// flying to a random slot every few seconds so sectors stream in and out (Phase 8 acceptance).

const HOP_MS = 4000;

export function usePerfTour(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;
    useExperience.getState().setPerfOverlay(true);
    useUniverse.getState().setPerf(true);
    const timer = window.setInterval(() => {
      const { rig, slotCount } = useUniverse.getState();
      if (rig === null || slotCount === 0) return;
      rig.flyTo(slotToPosition(Math.floor(Math.random() * slotCount)));
    }, HOP_MS);
    return () => {
      window.clearInterval(timer);
      useExperience.getState().setPerfOverlay(false);
      useUniverse.getState().setPerf(false);
    };
  }, [enabled]);
}
