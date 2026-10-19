import { create } from "zustand";

import type { Id } from "@convex/_generated/dataModel";
import { sectorKeyFor, slotToPosition } from "@convex/shared/galaxy";
import type { WorldParams } from "@convex/shared/worldParams";

// Universe state (SPEC §8.4). The DOM layer runs the Convex queries and writes here; the 3D
// layer reads. Pins live in a bounded LRU of sectors, so memory stays flat while flying.

export interface SectorPin {
  id: Id<"worlds">;
  slot: number;
  name: string;
  username: string;
  colorA: string;
  colorB: string;
  level: number;
}

export interface UniversePin extends SectorPin {
  x: number;
  y: number;
  z: number;
  sectorKey: string;
}

export interface Renderable {
  params: WorldParams;
  level: number;
}

export interface FlyOptions {
  /** Called once the camera has arrived (not when the flight is interrupted). */
  onArrive?: () => void;
}

/** Commands the camera rig exposes to the DOM layer. */
export interface RigApi {
  /** Flies to a world, or to any point on the galaxy (the perf tour flies to bare slots). */
  flyTo: (to: { x: number; y: number; z: number }, options?: FlyOptions) => void;
  skip: () => void;
  stop: () => void;
  pan: (right: number, forward: number) => void;
  zoom: (direction: 1 | -1) => void;
  overview: () => void;
  /** Writes the point the camera looks at, on the galaxy plane (drives streaming). */
  groundPoint: (out: { x: number; z: number }) => void;
}

export interface Birth {
  pin: UniversePin;
  /** performance.now() in seconds. */
  at: number;
}

/** 3x3 around the camera, plus two recent rings of history. */
export const SECTOR_CACHE = 27;
const BIRTH_HISTORY = 24;

interface UniverseState {
  slotCount: number;
  live: boolean;
  pins: Map<number, UniversePin>;
  /** Loaded sectors and their slots, least recently used first. */
  sectors: Map<string, number[]>;
  /** Bumped on every pin change, so effects know to re-read `pins`. */
  version: number;
  births: Birth[];
  wanted: string[];
  nearSlots: number[];
  renderables: Map<Id<"worlds">, Renderable>;
  hovered: UniversePin | null;
  focused: UniversePin | null;
  selected: UniversePin | null;
  flight: { active: boolean; skippable: boolean };
  scrim: boolean;
  rig: RigApi | null;
  surface: HTMLElement | null;
  /** The DOM name tag the picker positions every frame. */
  label: HTMLElement | null;
  /** Dev only: mounts the perf probe (`?perf=1`). */
  perf: boolean;
  setOverview: (slotCount: number, live: boolean) => void;
  loadSector: (key: string, pins: readonly SectorPin[]) => void;
  setWanted: (keys: string[]) => void;
  setNearSlots: (slots: number[]) => void;
  /** Merges fetched params, dropping any world not in `keep` (bounded by the near count). */
  setRenderables: (
    worlds: readonly ({ id: Id<"worlds"> } & Renderable)[],
    keep: ReadonlySet<Id<"worlds">>,
  ) => void;
  setHovered: (pin: UniversePin | null) => void;
  setFocused: (pin: UniversePin | null) => void;
  setSelected: (pin: UniversePin | null) => void;
  setFlight: (active: boolean, skippable?: boolean) => void;
  setScrim: (on: boolean) => void;
  setRig: (rig: RigApi | null) => void;
  setSurface: (element: HTMLElement | null) => void;
  setLabel: (element: HTMLElement | null) => void;
  setPerf: (on: boolean) => void;
  /** Drops loaded data (pins, sectors, selection). Elements and the rig register themselves. */
  reset: () => void;
}

export function placePin(pin: SectorPin): UniversePin {
  const { x, y, z } = slotToPosition(pin.slot);
  return { ...pin, x, y, z, sectorKey: sectorKeyFor(x, z) };
}

const sameList = (a: readonly string[], b: readonly string[]): boolean =>
  a.length === b.length && a.every((value, index) => value === b[index]);

const initial = () => ({
  slotCount: 0,
  live: true,
  pins: new Map<number, UniversePin>(),
  sectors: new Map<string, number[]>(),
  version: 0,
  births: [] as Birth[],
  wanted: [] as string[],
  nearSlots: [] as number[],
  renderables: new Map<Id<"worlds">, Renderable>(),
  hovered: null,
  focused: null,
  selected: null,
  flight: { active: false, skippable: false },
  scrim: false,
});

export const useUniverse = create<UniverseState>()((set, get) => ({
  ...initial(),
  rig: null,
  surface: null,
  label: null,
  perf: false,
  setOverview: (slotCount, live) => {
    if (get().slotCount !== slotCount || get().live !== live) set({ slotCount, live });
  },
  loadSector: (key, incoming) => {
    const { pins, sectors, births, live } = get();
    const previous = sectors.get(key);
    const known = new Set(previous);
    const now = performance.now() / 1000;
    const born: Birth[] = [];
    for (const slot of previous ?? []) pins.delete(slot);
    for (const raw of incoming) {
      const pin = placePin(raw);
      pins.set(pin.slot, pin);
      // A pin new to a sector we already had is a birth (§8.4), not a first load.
      if (previous !== undefined && !known.has(pin.slot) && live) born.push({ pin, at: now });
    }
    sectors.delete(key);
    sectors.set(
      key,
      incoming.map((pin) => pin.slot),
    );
    for (const [oldKey, slots] of sectors) {
      if (sectors.size <= SECTOR_CACHE) break;
      if (get().wanted.includes(oldKey)) continue;
      for (const slot of slots) pins.delete(slot);
      sectors.delete(oldKey);
    }
    set((state) => ({
      version: state.version + 1,
      births: born.length === 0 ? births : [...births, ...born].slice(-BIRTH_HISTORY),
    }));
  },
  setWanted: (keys) => {
    if (!sameList(get().wanted, keys)) set({ wanted: keys });
  },
  setNearSlots: (slots) => {
    const current = get().nearSlots;
    const same = current.length === slots.length && current.every((slot, i) => slot === slots[i]);
    if (!same) set({ nearSlots: slots });
  },
  setRenderables: (worlds, keep) => {
    const renderables = new Map<Id<"worlds">, Renderable>();
    for (const [id, world] of get().renderables) if (keep.has(id)) renderables.set(id, world);
    for (const world of worlds) {
      if (keep.has(world.id))
        renderables.set(world.id, { params: world.params, level: world.level });
    }
    set({ renderables });
  },
  setHovered: (pin) => {
    if (get().hovered?.slot !== pin?.slot) set({ hovered: pin });
  },
  setFocused: (pin) => {
    set({ focused: pin });
  },
  setSelected: (pin) => {
    set({ selected: pin });
  },
  setFlight: (active, skippable = false) => {
    set({ flight: { active, skippable: active && skippable } });
  },
  setScrim: (on) => {
    set({ scrim: on });
  },
  setRig: (rig) => {
    set({ rig });
  },
  setSurface: (element) => {
    set({ surface: element });
  },
  setLabel: (element) => {
    set({ label: element });
  },
  setPerf: (on) => {
    set({ perf: on });
  },
  reset: () => {
    set(initial());
  },
}));
