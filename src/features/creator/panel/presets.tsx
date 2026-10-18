"use client";

import { Check } from "lucide-react";
import { RadioGroup } from "radix-ui";

import { BIOMES, type Biome, presetParams } from "@convex/shared/worldParams";

import { PlanetDisc } from "@/three/planet/PlanetDisc";

import { biomeName } from "../names";
import { useCreator } from "../store";
import type { CreatorActions } from "../use-creator-actions";

// The six biomes as cards (06 creator). Each card shows a small disc in its brand palette:
// CSS from world data, never a mockup image.

const PREVIEWS = Object.fromEntries(
  BIOMES.map((biome) => [biome, presetParams(biome, 1)]),
) as Record<Biome, ReturnType<typeof presetParams>>;

export function Presets({ actions, labelledBy }: { actions: CreatorActions; labelledBy: string }) {
  const biome = useCreator((state) => state.history.present.params.biome);
  return (
    <RadioGroup.Root
      aria-labelledby={labelledBy}
      value={biome}
      onValueChange={(next) => {
        actions.preset(next as Biome);
      }}
      className="grid grid-cols-3 gap-2"
    >
      {BIOMES.map((option) => (
        <RadioGroup.Item
          key={option}
          value={option}
          className="group relative flex min-h-touch pressable flex-col items-center gap-1.5 rounded-md px-2 py-3 text-text border-control hover:bg-surface-raised data-[state=checked]:border-accent data-[state=checked]:shadow-selection"
        >
          <span aria-hidden className="block size-11">
            <PlanetDisc params={PREVIEWS[option]} />
          </span>
          <span className="wl-label">{biomeName(option)}</span>
          <RadioGroup.Indicator className="absolute top-1 right-1 grid size-6 place-items-center rounded-full bg-accent text-on-accent">
            <Check aria-hidden className="size-4" />
          </RadioGroup.Indicator>
        </RadioGroup.Item>
      ))}
    </RadioGroup.Root>
  );
}
