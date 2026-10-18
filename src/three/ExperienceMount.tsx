"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import { useEffectiveTier, useExperience } from "@/stores/experience";

import { MotionControl } from "./MotionControl";
import { detectTier, isRenderTier } from "./quality";

// Mounted once in the root layout (ADR-019). Loads the 3D chunk only after a page registers a
// view, so pages without 3D keep their initial-JS budget (SPEC §8.8).

const ExperienceRoot = dynamic(() => import("./ExperienceRoot"), { ssr: false });

function useMotionPreference(): void {
  const setReducedMotion = useExperience((state) => state.setReducedMotion);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      setReducedMotion(query.matches);
    };
    sync();
    query.addEventListener("change", sync);
    return () => {
      query.removeEventListener("change", sync);
    };
  }, [setReducedMotion]);
}

function useTierDetection(wanted: boolean): void {
  const detected = useExperience((state) => state.detectedTier !== null);
  const setDetected = useExperience((state) => state.setDetected);
  useEffect(() => {
    if (!wanted || detected) return;
    let cancelled = false;
    void detectTier().then(({ tier, gpu }) => {
      if (!cancelled) setDetected(tier, gpu);
    });
    return () => {
      cancelled = true;
    };
  }, [wanted, detected, setDetected]);
}

/**
 * True from the first registered view on. The canvas then stays for the session (ADR-002,
 * ADR-019): unmounting it would dispose the context and cost a new one on the next 3D page.
 */
function useCanvasWanted(views: number): boolean {
  const [wanted, setWanted] = useState(false);
  if (views > 0 && !wanted) setWanted(true);
  return wanted;
}

export function ExperienceMount() {
  const views = useExperience((state) => state.views);
  const canvasWanted = useCanvasWanted(views);
  const webgl = useExperience((state) => state.webgl);
  const tier = useEffectiveTier();
  useMotionPreference();
  useTierDetection(views > 0);

  return (
    <>
      {canvasWanted && isRenderTier(tier) ? <ExperienceRoot tier={tier} /> : null}
      {webgl === "lost" ? (
        <p
          role="status"
          className="fixed inset-x-0 top-4 z-50 mx-auto w-fit rounded-full glass px-4 py-2 wl-small text-text"
        >
          Re-awakening the universe…
        </p>
      ) : null}
      {views > 0 ? <MotionControl /> : null}
    </>
  );
}
