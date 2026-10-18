"use client";

import { createContext, type ReactNode, useContext, useState } from "react";
import { createStore, type StoreApi, useStore } from "zustand";

import type { CreatorWorld } from "./edits";
import { createHistory, type History, preview, record, redo, undo } from "./history";

// One creator store per /create mount. Gestures (slider drags, typing the name) preview live
// and become a single undo step when they end.

export interface CreatorState {
  history: History<CreatorWorld>;
  /** Where the current gesture started, or null outside a gesture. */
  gestureFrom: CreatorWorld | null;
  /** Live change during a gesture. No history step yet. */
  preview: (next: CreatorWorld) => void;
  /** Ends the gesture as one undo step labeled `label`. */
  commit: (label: string) => void;
  /** A one-shot change (preset, palette, randomize) as one undo step. */
  change: (next: CreatorWorld, label: string) => void;
  /** Returns the label of the undone change, or null when there is nothing to undo. */
  undo: () => string | null;
  redo: () => string | null;
  /** Starts over from `world`, with empty history. */
  load: (world: CreatorWorld) => void;
}

export function createCreatorStore(initial: CreatorWorld): StoreApi<CreatorState> {
  return createStore<CreatorState>()((set, get) => ({
    history: createHistory(initial),
    gestureFrom: null,
    preview: (next) => {
      const { history, gestureFrom } = get();
      set({ history: preview(history, next), gestureFrom: gestureFrom ?? history.present });
    },
    commit: (label) => {
      const { history, gestureFrom } = get();
      if (gestureFrom === null) return;
      const changed = JSON.stringify(gestureFrom) !== JSON.stringify(history.present);
      set({
        history: changed ? record(history, history.present, label, gestureFrom) : history,
        gestureFrom: null,
      });
    },
    change: (next, label) => {
      const { history, gestureFrom } = get();
      set({
        history: record(history, next, label, gestureFrom ?? history.present),
        gestureFrom: null,
      });
    },
    undo: () => {
      const step = undo(get().history);
      if (step === null) return null;
      set({ history: step.history, gestureFrom: null });
      return step.label;
    },
    redo: () => {
      const step = redo(get().history);
      if (step === null) return null;
      set({ history: step.history, gestureFrom: null });
      return step.label;
    },
    load: (world) => {
      set({ history: createHistory(world), gestureFrom: null });
    },
  }));
}

const CreatorContext = createContext<StoreApi<CreatorState> | null>(null);

export function CreatorProvider({
  initial,
  children,
}: {
  initial: CreatorWorld;
  children: ReactNode;
}) {
  const [store] = useState(() => createCreatorStore(initial));
  return <CreatorContext value={store}>{children}</CreatorContext>;
}

export function useCreatorStore(): StoreApi<CreatorState> {
  const store = useContext(CreatorContext);
  if (store === null) throw new Error("useCreatorStore needs a CreatorProvider");
  return store;
}

export function useCreator<T>(selector: (state: CreatorState) => T): T {
  return useStore(useCreatorStore(), selector);
}

/** The world as it looks right now, including a gesture in progress. */
export function useCreatorWorld(): CreatorWorld {
  return useCreator((state) => state.history.present);
}
