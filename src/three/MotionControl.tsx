"use client";

import { Pause, Play } from "lucide-react";

import { IconButton } from "@/components/ui/icon-button";
import { useExperience } from "@/stores/experience";

/**
 * The persistent Pause motion control (SPEC §3.5, 05 motion). Survives navigation. Bottom
 * panels (the creator sheet) lift it above themselves with `--motion-control-lift`.
 */
export function MotionControl() {
  const paused = useExperience((state) => state.motionPaused);
  const setPaused = useExperience((state) => state.setMotionPaused);
  return (
    <div className="fixed right-4 bottom-[calc(var(--motion-control-lift,0rem)+--spacing(4))] z-40 rounded-full glass">
      <IconButton
        label="Pause motion"
        aria-pressed={paused}
        icon={paused ? <Play /> : <Pause />}
        onClick={() => {
          setPaused(!paused);
        }}
      />
    </div>
  );
}
