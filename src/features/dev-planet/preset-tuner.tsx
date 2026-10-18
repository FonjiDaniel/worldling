"use client";

import { button, Leva, useControls } from "leva";
import { useEffect } from "react";

import { findPalette, palettesFor } from "@convex/shared/worldPalettes";
import {
  BIOMES,
  type Biome,
  type WorldParams,
  worldParamsSchema,
} from "@convex/shared/worldParams";

import { useExperience } from "@/stores/experience";

interface PresetTunerProps {
  biome: Biome;
  params: WorldParams;
  level: number;
  onSelect: (biome: Biome) => void;
  onLevel: (level: number) => void;
  onChange: (params: WorldParams) => void;
}

const slider = (value: number, min: number, max: number) => ({ value, min, max, step: 0.01 });

/** leva panel for the selected preset. "Copy params" logs JSON to paste into PRESETS. */
export function PresetTuner({
  biome,
  params,
  level,
  onSelect,
  onLevel,
  onChange,
}: PresetTunerProps) {
  const global = useControls("Playground", {
    biome: { value: biome, options: [...BIOMES] },
    level: { value: level, min: 1, max: 10, step: 1 },
    tier: { value: "auto", options: ["auto", "1", "2", "3"] },
    paused: false,
    perf: false,
  });

  const values = useControls(
    biome,
    {
      seed: { value: params.seed, step: 1, min: 0 },
      palette: { value: params.palette.id, options: palettesFor(biome).map((p) => p.id) },
      scale: slider(params.terrain.scale, 0.5, 3),
      roughness: slider(params.terrain.roughness, 0, 1),
      amplitude: { value: params.terrain.amplitude, min: 0, max: 0.25, step: 0.005 },
      seaLevel: slider(params.terrain.seaLevel, 0, 1),
      gloss: slider(params.ocean.gloss, 0, 1),
      density: slider(params.atmosphere.density, 0, 1),
      coverage: slider(params.clouds.coverage, 0, 1),
      cloudSpeed: slider(params.clouds.speed, 0, 1),
      spin: slider(params.motion.spin, 0, 1),
      tilt: slider(params.motion.tilt, 0, 0.5),
      "Copy params": button(() => {
        console.info(JSON.stringify(params, null, 2));
        void navigator.clipboard.writeText(JSON.stringify(params));
      }),
    },
    [biome],
  );

  useEffect(() => {
    if (global.biome !== biome) onSelect(global.biome);
    if (global.level !== level) onLevel(global.level);
    const tier = global.tier === "auto" ? null : Number(global.tier);
    const state = useExperience.getState();
    if (tier !== state.override)
      useExperience.setState({ override: tier as typeof state.override });
    state.setMotionPaused(global.paused);
    state.setPerfOverlay(global.perf);
  }, [global, biome, level, onSelect, onLevel]);

  useEffect(() => {
    const palette = findPalette(values.palette) ?? palettesFor(biome)[0];
    if (!palette) return;
    const next = worldParamsSchema.parse({
      ...params,
      seed: Math.max(0, Math.floor(values.seed)),
      terrain: {
        scale: values.scale,
        roughness: values.roughness,
        amplitude: values.amplitude,
        seaLevel: values.seaLevel,
      },
      palette: { id: palette.id, stops: [...palette.stops] },
      ocean: { color: palette.ocean, gloss: values.gloss },
      atmosphere: { color: palette.atmosphere, density: values.density },
      clouds: { coverage: values.coverage, speed: values.cloudSpeed, color: palette.clouds },
      motion: { spin: values.spin, tilt: values.tilt },
    });
    if (JSON.stringify(next) !== JSON.stringify(params)) onChange(next);
  }, [values, biome, params, onChange]);

  return <Leva collapsed={false} titleBar={{ title: "Tune" }} />;
}
