"use client";

import { useEffect, useRef } from "react";

import { type Biome, describeWorld } from "@convex/shared/worldParams";

import { useExperience } from "@/stores/experience";
import { playReform } from "@/three/planet/reform";

import { useAnnounce } from "./announcer";
import { applyPalette, applyPreset, randomize } from "./edits";
import { biomeName, paletteName } from "./names";
import { useCreatorStore } from "./store";

/** The creator's one-shot actions, each one undoable and announced (SPEC §2.2, §3.7). */
export function useCreatorActions() {
  const store = useCreatorStore();
  const announce = useAnnounce();
  const stopReform = useRef<(() => void) | null>(null);

  useEffect(
    () => () => {
      stopReform.current?.();
    },
    [],
  );

  return {
    randomize: () => {
      const state = store.getState();
      const from = state.history.present;
      const next = randomize(from);
      stopReform.current?.();
      // Feedback is immediate: history, draft and the announcement update now; only the
      // planet waits for the re-form's midpoint to show the new world.
      state.hold(state.held ?? from.params);
      state.change(next, "new random world");
      stopReform.current = playReform(
        state.handle,
        () => {
          store.getState().hold(null);
        },
        useExperience.getState().reducedMotion,
      );
      announce(`A new world: ${describeWorld(next.params)}`);
    },
    preset: (biome: Biome) => {
      const state = store.getState();
      const { present } = state.history;
      state.change(
        { ...present, params: applyPreset(present.params, biome) },
        `${biomeName(biome)} preset`,
      );
      announce(`${biomeName(biome)} preset`);
    },
    palette: (paletteId: string) => {
      const state = store.getState();
      const { present } = state.history;
      state.change({ ...present, params: applyPalette(present.params, paletteId) }, "colors");
      announce(`${paletteName(paletteId)} colors`);
    },
    undo: () => {
      const label = store.getState().undo();
      announce(label === null ? "Nothing to undo" : `Undid ${label}`);
    },
    redo: () => {
      const label = store.getState().redo();
      announce(label === null ? "Nothing to redo" : `Redid ${label}`);
    },
  };
}

export type CreatorActions = ReturnType<typeof useCreatorActions>;
