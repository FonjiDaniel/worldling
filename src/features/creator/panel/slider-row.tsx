"use client";

import { useId } from "react";

import { Slider } from "@/components/ui/slider";

import { fromPercent, type SliderKey, SLIDERS, sliderPercent } from "../edits";
import { useCreator, useCreatorStore } from "../store";

/** A labeled 0 to 100% slider for one world param. A drag is one undo step. */
export function SliderRow({ control }: { control: SliderKey }) {
  const spec = SLIDERS[control];
  const store = useCreatorStore();
  const percent = useCreator((state) =>
    sliderPercent(spec, spec.get(state.history.present.params)),
  );
  const labelId = useId();

  return (
    <div className="flex flex-col">
      <div className="flex items-baseline justify-between gap-3">
        <span id={labelId} className="wl-label text-text">
          {spec.label}
        </span>
        <span aria-hidden className="wl-timestamp text-text-muted">
          {percent}%
        </span>
      </div>
      <Slider
        label={spec.label}
        aria-labelledby={labelId}
        min={0}
        max={100}
        step={1}
        value={[percent]}
        valueText={(value) => `${String(value)} percent`}
        onValueChange={([value = percent]) => {
          const state = store.getState();
          const { present } = state.history;
          state.preview({ ...present, params: spec.set(present.params, fromPercent(spec, value)) });
        }}
        onValueCommit={() => {
          store.getState().commit(`${spec.label.toLowerCase()} change`);
        }}
      />
    </div>
  );
}
