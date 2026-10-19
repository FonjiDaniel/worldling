"use client";

import { describeWorld, type WorldParams } from "@convex/shared/worldParams";

import { useEffectiveTier } from "@/stores/experience";

import { frameRadius, PlanetCamera } from "../camera/PlanetCamera";
import { isRenderTier } from "../quality";
import { ThreeView } from "../ThreeView";
import type { PlanetHandle } from "./handle";
import { Planet } from "./Planet";
import { PlanetDisc } from "./PlanetDisc";

export interface PlanetViewProps {
  params: WorldParams;
  /** Bloom level, 1 to 10. */
  level: number;
  className?: string;
  /** World radius the camera frames. Defaults leave room for moons once they appear. */
  frame?: number;
  /** Lets the page re-form or turn the world without re-rendering. */
  handle?: Readonly<PlanetHandle>;
  /** Recent comet ids, newest first, drawn as streaks in orbit. */
  comets?: readonly string[];
}

/** A world in a DOM box, with its text description and a non-WebGL fallback. */
export function PlanetView({ params, level, className, frame, handle, comets }: PlanetViewProps) {
  const tier = useEffectiveTier();
  const radius = frame ?? frameRadius(level, (comets?.length ?? 0) > 0);
  return (
    <ThreeView
      label={describeWorld(params, level)}
      fallback={<PlanetDisc params={params} />}
      className={className}
    >
      <PlanetCamera radius={radius} />
      {isRenderTier(tier) ? (
        <Planet
          params={params}
          level={level}
          tier={tier}
          {...(handle && { handle })}
          {...(comets && { comets })}
        />
      ) : null}
    </ThreeView>
  );
}
