"use client";

import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { useId, useState } from "react";

import { palettesFor } from "@convex/shared/worldPalettes";

import { Button } from "@/components/ui/button";
import { SwatchPicker } from "@/components/ui/swatch-picker";
import { cn } from "@/lib/utils";

import { applyColor, type ColorSlot, colorAt } from "../edits";
import { paletteName } from "../names";
import { useCreator, useCreatorStore } from "../store";
import type { CreatorActions } from "../use-creator-actions";

// Curated palettes first; advanced mode lets people pick any color, clamped into the safe
// range so every world still looks good (SPEC §3.8, ADR-009).

const SLOTS: { slot: ColorSlot; label: string }[] = [
  { slot: "stop0", label: "Shore" },
  { slot: "stop1", label: "Lowlands" },
  { slot: "stop2", label: "Hills" },
  { slot: "stop3", label: "Highlands" },
  { slot: "stop4", label: "Peaks" },
  { slot: "ocean", label: "Ocean" },
  { slot: "clouds", label: "Clouds" },
  { slot: "air", label: "Air glow" },
];

export function Colors({ actions }: { actions: CreatorActions }) {
  const biome = useCreator((state) => state.history.present.params.biome);
  const paletteId = useCreator((state) => state.history.present.params.palette.id);
  const [advanced, setAdvanced] = useState(paletteId === "custom");
  const advancedId = useId();
  const swatches = palettesFor(biome).map((palette) => ({
    value: palette.id,
    name: paletteName(palette.id),
    color: palette.stops[2],
  }));

  return (
    <div className="flex flex-col gap-4">
      <SwatchPicker
        label="Landscape colors"
        swatches={swatches}
        value={paletteId}
        onValueChange={actions.palette}
      />
      {paletteId === "custom" ? (
        <p className="wl-small text-text-muted">Your own colors. Pick a palette to go back.</p>
      ) : null}
      <Button
        variant="ghost"
        size="sm"
        className="self-start"
        aria-expanded={advanced}
        aria-controls={advancedId}
        onClick={() => {
          setAdvanced((open) => !open);
        }}
      >
        <SlidersHorizontal aria-hidden />
        Custom colors
        <ChevronDown aria-hidden className={cn("transition-transform", advanced && "rotate-180")} />
      </Button>
      <div id={advancedId} hidden={!advanced}>
        {advanced ? <CustomColors /> : null}
      </div>
    </div>
  );
}

function CustomColors() {
  const store = useCreatorStore();
  const params = useCreator((state) => state.history.present.params);
  const [adjusted, setAdjusted] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {SLOTS.map(({ slot, label }) => (
          <ColorInput
            key={slot}
            label={label}
            value={colorAt(params, slot)}
            onPreview={(raw) => {
              const state = store.getState();
              const { present } = state.history;
              const edit = applyColor(present.params, slot, raw);
              setAdjusted(edit.adjusted);
              state.preview({ ...present, params: edit.params });
            }}
            onCommit={() => {
              store.getState().commit(`${label.toLowerCase()} color`);
            }}
          />
        ))}
      </div>
      <p role="status" className="wl-small text-text-muted">
        {adjusted ? "Adjusted to keep your world easy on the eyes." : ""}
      </p>
    </div>
  );
}

function ColorInput(props: {
  label: string;
  value: string;
  onPreview: (value: string) => void;
  onCommit: () => void;
}) {
  const id = useId();
  return (
    <div className="flex items-center gap-3">
      <input
        id={id}
        type="color"
        value={props.value}
        onChange={(event) => {
          props.onPreview(event.target.value);
        }}
        onBlur={props.onCommit}
        className="size-touch shrink-0 cursor-pointer rounded-sm bg-transparent p-1 border-control"
      />
      <label htmlFor={id} className="flex flex-col">
        <span className="wl-label text-text">{props.label}</span>
        <span className="wl-timestamp text-text-muted uppercase">{props.value}</span>
      </label>
    </div>
  );
}
