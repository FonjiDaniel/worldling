"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { Vector3 } from "three";

import { type UniversePin, useUniverse } from "./store";

// Picking (SPEC §8.4, ADR-024): the loaded pins projected to screen space, nearest one under the
// pointer within a small radius. Buffers are rebuilt when pins change, never inside useFrame.

const PICK_RADIUS_PX = 22;
const CLICK_SLOP_PX = 6;
const LABEL_LIFT_PX = 18;

interface PickState {
  count: number;
  xyz: Float32Array;
  slots: Int32Array;
  pointer: { x: number; y: number; dirty: boolean; inside: boolean };
  down: { x: number; y: number };
  width: number;
  height: number;
}

function rebuild(pick: PickState, pins: ReadonlyMap<number, UniversePin>): void {
  if (pins.size > pick.slots.length) {
    pick.xyz = new Float32Array(pins.size * 6);
    pick.slots = new Int32Array(pins.size * 2);
  }
  let i = 0;
  for (const pin of pins.values()) {
    pick.xyz[i * 3] = pin.x;
    pick.xyz[i * 3 + 1] = pin.y;
    pick.xyz[i * 3 + 2] = pin.z;
    pick.slots[i] = pin.slot;
    i += 1;
  }
  pick.count = i;
}

function usePointer(pick: PickState, surface: HTMLElement | null): void {
  useEffect(() => {
    if (surface === null) return;
    const local = (event: PointerEvent) => {
      const rect = surface.getBoundingClientRect();
      pick.width = rect.width;
      pick.height = rect.height;
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };
    const move = (event: PointerEvent) => {
      Object.assign(pick.pointer, local(event), { dirty: true, inside: true });
    };
    const down = (event: PointerEvent) => {
      Object.assign(pick.down, local(event));
    };
    const up = (event: PointerEvent) => {
      const { x, y } = local(event);
      if (Math.hypot(x - pick.down.x, y - pick.down.y) > CLICK_SLOP_PX) return;
      const { hovered, rig, flight, setSelected } = useUniverse.getState();
      if (hovered === null || rig === null || flight.active) return;
      setSelected(hovered);
      rig.flyTo(hovered);
    };
    const leave = () => {
      pick.pointer.inside = false;
      pick.pointer.dirty = true;
    };
    surface.addEventListener("pointermove", move);
    surface.addEventListener("pointerdown", down);
    surface.addEventListener("pointerup", up);
    surface.addEventListener("pointerleave", leave);
    return () => {
      surface.removeEventListener("pointermove", move);
      surface.removeEventListener("pointerdown", down);
      surface.removeEventListener("pointerup", up);
      surface.removeEventListener("pointerleave", leave);
    };
  }, [pick, surface]);
}

const projected = new Vector3();

type Camera = Parameters<Vector3["project"]>[0];

/** The pin nearest the pointer within the pick radius, or -1. */
function pickSlot(pick: PickState, camera: Camera): number {
  let best = -1;
  let bestD = PICK_RADIUS_PX ** 2;
  for (let i = 0; i < pick.count; i += 1) {
    projected.set(pick.xyz[i * 3] ?? 0, pick.xyz[i * 3 + 1] ?? 0, pick.xyz[i * 3 + 2] ?? 0);
    projected.project(camera);
    if (projected.z > 1) continue;
    const dx = ((projected.x + 1) / 2) * pick.width - pick.pointer.x;
    const dy = ((1 - projected.y) / 2) * pick.height - pick.pointer.y;
    const d = dx * dx + dy * dy;
    if (d < bestD) {
      bestD = d;
      best = pick.slots[i] ?? -1;
    }
  }
  return best;
}

function pickFrame(pick: PickState, surface: HTMLElement, camera: Camera): void {
  const state = useUniverse.getState();
  pick.width = surface.clientWidth;
  pick.height = surface.clientHeight;
  // Picking is off during a flight (§8.5).
  if (pick.pointer.dirty || state.flight.active) {
    pick.pointer.dirty = false;
    const best = pick.pointer.inside && !state.flight.active ? pickSlot(pick, camera) : -1;
    state.setHovered(best < 0 ? null : (state.pins.get(best) ?? null));
    surface.style.cursor = best < 0 ? "" : "pointer";
  }
  placeLabel(state.label, state.hovered ?? state.focused, camera, pick);
}

export function Picker() {
  const camera = useThree((state) => state.camera);
  const surface = useUniverse((state) => state.surface);
  const pick = useMemo<PickState>(
    () => ({
      count: 0,
      xyz: new Float32Array(0),
      slots: new Int32Array(0),
      pointer: { x: 0, y: 0, dirty: false, inside: false },
      down: { x: 0, y: 0 },
      width: 1,
      height: 1,
    }),
    [],
  );
  usePointer(pick, surface);

  useEffect(() => {
    rebuild(pick, useUniverse.getState().pins);
    return useUniverse.subscribe((state, previous) => {
      if (state.version !== previous.version) rebuild(pick, state.pins);
    });
  }, [pick]);

  useFrame(() => {
    if (surface !== null) pickFrame(pick, surface, camera);
  });

  return null;
}

function placeLabel(
  label: HTMLElement | null,
  pin: UniversePin | null,
  camera: Camera,
  pick: PickState,
): void {
  if (label === null) return;
  if (pin === null) {
    label.style.visibility = "hidden";
    return;
  }
  projected.set(pin.x, pin.y, pin.z).project(camera);
  const visible = projected.z <= 1 && Math.abs(projected.x) <= 1 && Math.abs(projected.y) <= 1;
  label.style.visibility = visible ? "visible" : "hidden";
  const x = ((projected.x + 1) / 2) * pick.width;
  const y = ((1 - projected.y) / 2) * pick.height - LABEL_LIFT_PX;
  label.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -100%)`;
}
