"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { clampLevel } from "@convex/shared/bloom";
import { BIOMES, type Biome, presetParams, type WorldParams } from "@convex/shared/worldParams";

import { useExperience } from "@/stores/experience";
import { freezeWorldTime } from "@/three/clock";
import { PlanetView } from "@/three/planet/PlanetView";
import { isTier } from "@/three/quality";

import { MoodboardTile } from "./moodboard-tile";
import { PresetTuner } from "./preset-tuner";

/** World time used by ?freeze=1 so screenshots are deterministic. */
const FROZEN_AT_S = 30;
const DEFAULT_LEVEL = 4;
const PRESET_SEED = 7;

function useDevQuery(): { level: number; frozen: boolean; focus: Biome | null } {
  const query = useSearchParams();
  const tierParam = Number(query.get("tier"));
  const frozen = query.get("freeze") === "1";
  useEffect(() => {
    if (isTier(tierParam)) useExperience.setState({ override: tierParam });
    freezeWorldTime(frozen ? FROZEN_AT_S : null);
    useExperience.getState().setPerfOverlay(query.get("perf") === "1");
    return () => {
      freezeWorldTime(null);
      useExperience.getState().setPerfOverlay(false);
    };
  }, [tierParam, frozen, query]);
  const focusParam = query.get("focus");
  const focus = BIOMES.find((biome) => biome === focusParam) ?? null;
  return { level: clampLevel(Number(query.get("level") ?? DEFAULT_LEVEL)), frozen, focus };
}

function Playground() {
  const { level: queryLevel, frozen, focus } = useDevQuery();
  const shown = focus ? [focus] : BIOMES;
  const [level, setLevel] = useState(queryLevel);
  const [selected, setSelected] = useState<Biome>("oceanic");
  const [worlds, setWorlds] = useState<Record<Biome, WorldParams>>(
    () =>
      Object.fromEntries(
        BIOMES.map((biome) => [biome, presetParams(biome, PRESET_SEED)]),
      ) as Record<Biome, WorldParams>,
  );

  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-2">
        <h1>Planet playground</h1>
        <p className="wl-small text-text-muted">
          Each preset next to its moodboard reference. Level {level}. Add ?freeze=1 for still
          frames, ?tier=1|2|3 to pin quality, ?focus=desert for one large preset, ?perf=1 for stats.
        </p>
      </header>
      {frozen ? null : (
        <PresetTuner
          biome={selected}
          params={worlds[selected]}
          level={level}
          onSelect={setSelected}
          onLevel={setLevel}
          onChange={(params) => {
            setWorlds((current) => ({ ...current, [params.biome]: params }));
          }}
        />
      )}
      <ul className={focus ? "grid" : "grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3"}>
        {shown.map((biome) => (
          <li key={biome} className="flex flex-col gap-2">
            <h2 className="wl-label capitalize">{biome}</h2>
            <div className="grid grid-cols-2 gap-2">
              <PlanetView
                params={worlds[biome]}
                level={level}
                className="aspect-square rounded-md border border-line"
              />
              <MoodboardTile index={BIOMES.indexOf(biome)} biome={biome} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DevPlanetPlayground() {
  return (
    <Suspense>
      <Playground />
    </Suspense>
  );
}
