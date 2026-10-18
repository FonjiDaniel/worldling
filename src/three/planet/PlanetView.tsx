"use client";

import { unlocksFor } from "@convex/shared/bloom";
import { describeWorld, type WorldParams } from "@convex/shared/worldParams";

import { useEffectiveTier } from "@/stores/experience";

import { PlanetCamera } from "../camera/PlanetCamera";
import { isRenderTier } from "../quality";
import { ThreeView } from "../ThreeView";
import { Planet } from "./Planet";
import { PlanetDisc } from "./PlanetDisc";

const PLANET_FRAME = 1.2;
const MOON_FRAME = 2.1;

export interface PlanetViewProps {
  params: WorldParams;
  /** Bloom level, 1 to 10. */
  level: number;
  className?: string;
  /** World radius the camera frames. Defaults leave room for moons once they appear. */
  frame?: number;
}

/** A world in a DOM box, with its text description and a non-WebGL fallback. */
export function PlanetView({ params, level, className, frame }: PlanetViewProps) {
  const tier = useEffectiveTier();
  const radius = frame ?? (unlocksFor(level).moons > 0 ? MOON_FRAME : PLANET_FRAME);
  return (
    <ThreeView
      label={describeWorld(params, level)}
      fallback={<PlanetDisc params={params} />}
      className={className}
    >
      <PlanetCamera radius={radius} />
      {isRenderTier(tier) ? <Planet params={params} level={level} tier={tier} /> : null}
    </ThreeView>
  );
}
