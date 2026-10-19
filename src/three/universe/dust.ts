import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Points,
  ShaderMaterial,
  Vector3,
} from "three";

import { hexToLinear } from "@convex/shared/color";
import { sectorKeyFor, slotToPosition } from "@convex/shared/galaxy";

import { dustFragment, dustVertex } from "../shaders/galaxy";
import { DUST_LEVEL_GROWTH, DUST_WORLD_SIZE, FAR_FADE_DISTANCE, MID_FADE_DISTANCE } from "./scale";
import { type Birth, type UniversePin, useUniverse } from "./store";

// Slot dust (ADR-024): one point per galaxy slot in a single draw call. Positions come from the
// slot alone; loaded sectors paint their pins' colors, and slots with no pin there fade out.

const STATE_HIDDEN = 0;
const STATE_DUST = 1;
const STATE_WORLD = 2;
const NEVER_BORN = -1e4;

export interface Dust {
  points: Points;
  capacity: number;
  /** Slots filled with positions so far. */
  filled: number;
  /** Every filled slot by sector, so a loaded sector can clear its empty slots. */
  bySector: Map<string, number[]>;
  /** Sectors currently painted with pin data. */
  painted: Set<string>;
  dustColor: readonly [number, number, number];
  uniforms: {
    uTime: { value: number };
    uPixelRatio: { value: number };
    uScale: { value: number };
    uBirthSeconds: { value: number };
    uFlash: { value: number };
    uNearFade: { value: number };
    uFarFade: { value: number };
    uDust: { value: Vector3 };
  };
}

const attribute = (count: number, size: number) =>
  new BufferAttribute(new Float32Array(count * size), size);

/** Capacity with headroom, so the buffers are rebuilt rarely as the galaxy grows. */
export const dustCapacity = (slotCount: number): number =>
  2 ** Math.ceil(Math.log2(Math.max(1024, slotCount * 1.25)));

export function createDust(capacity: number, starHex: string): Dust {
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", attribute(capacity, 3));
  geometry.setAttribute("aColorA", attribute(capacity, 3));
  geometry.setAttribute("aColorB", attribute(capacity, 3));
  geometry.setAttribute("aSize", attribute(capacity, 1));
  geometry.setAttribute("aState", attribute(capacity, 1));
  geometry.setAttribute("aBirth", attribute(capacity, 1));
  geometry.setDrawRange(0, 0);
  const uniforms = {
    uTime: { value: 0 },
    uPixelRatio: { value: 1 },
    uScale: { value: 1000 },
    uBirthSeconds: { value: 1.2 },
    uFlash: { value: 1 },
    uNearFade: { value: MID_FADE_DISTANCE },
    uFarFade: { value: FAR_FADE_DISTANCE },
    uDust: { value: new Vector3(...hexToLinear(starHex)) },
  };
  const material = new ShaderMaterial({
    vertexShader: dustVertex,
    fragmentShader: dustFragment,
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
  const points = new Points(geometry, material);
  points.frustumCulled = false;
  const star = hexToLinear(starHex);
  const dustColor = [star[0], star[1], star[2]] as const;
  return {
    points,
    capacity,
    filled: 0,
    bySector: new Map(),
    painted: new Set(),
    dustColor,
    uniforms,
  };
}

export function disposeDust(dust: Dust): void {
  dust.points.geometry.dispose();
  (dust.points.material as ShaderMaterial).dispose();
}

const arrayOf = (dust: Dust, name: string): Float32Array =>
  (dust.points.geometry.getAttribute(name) as BufferAttribute).array as Float32Array;

function markDirty(dust: Dust, names: readonly string[]): void {
  for (const name of names) {
    (dust.points.geometry.getAttribute(name) as BufferAttribute).needsUpdate = true;
  }
}

function paintDust(dust: Dust, slot: number): void {
  const [r, g, b] = dust.dustColor;
  arrayOf(dust, "aColorA").set([r, g, b], slot * 3);
  arrayOf(dust, "aColorB").set([r, g, b], slot * 3);
  arrayOf(dust, "aState")[slot] = STATE_DUST;
}

/** Adds positions for newly taken slots, up to capacity. */
export function fillSlots(dust: Dust, slotCount: number): void {
  const count = Math.min(slotCount, dust.capacity);
  if (count <= dust.filled) return;
  const position = arrayOf(dust, "position");
  const birth = arrayOf(dust, "aBirth");
  for (let slot = dust.filled; slot < count; slot += 1) {
    const { x, y, z } = slotToPosition(slot);
    position.set([x, y, z], slot * 3);
    birth[slot] = NEVER_BORN;
    paintDust(dust, slot);
    const key = sectorKeyFor(x, z);
    const slots = dust.bySector.get(key);
    if (slots) slots.push(slot);
    else dust.bySector.set(key, [slot]);
  }
  dust.filled = count;
  dust.points.geometry.setDrawRange(0, count);
  markDirty(dust, ["position", "aColorA", "aColorB", "aState", "aBirth"]);
}

/** Paints loaded sectors from their pins and returns unloaded ones to dust. */
export function paintSectors(
  dust: Dust,
  sectors: ReadonlyMap<string, readonly number[]>,
  pins: ReadonlyMap<number, UniversePin>,
): void {
  const colorA = arrayOf(dust, "aColorA");
  const colorB = arrayOf(dust, "aColorB");
  const size = arrayOf(dust, "aSize");
  const state = arrayOf(dust, "aState");
  for (const key of dust.painted) {
    if (sectors.has(key)) continue;
    for (const slot of dust.bySector.get(key) ?? []) paintDust(dust, slot);
    dust.painted.delete(key);
  }
  for (const [key, loaded] of sectors) {
    for (const slot of dust.bySector.get(key) ?? []) state[slot] = STATE_HIDDEN;
    for (const slot of loaded) {
      const pin = pins.get(slot);
      if (pin === undefined || slot >= dust.filled) continue;
      colorA.set(hexToLinear(pin.colorA), slot * 3);
      colorB.set(hexToLinear(pin.colorB), slot * 3);
      size[slot] = DUST_WORLD_SIZE * (1 + pin.level * DUST_LEVEL_GROWTH);
      state[slot] = STATE_WORLD;
    }
    dust.painted.add(key);
  }
  markDirty(dust, ["aColorA", "aColorB", "aSize", "aState"]);
}

/** Starts the birth animation for pins that just arrived. */
export function markBirths(dust: Dust, births: readonly Birth[]): void {
  const birth = arrayOf(dust, "aBirth");
  for (const { pin, at } of births) if (pin.slot < dust.filled) birth[pin.slot] = at;
  markDirty(dust, ["aBirth"]);
}

/** Pixels per world unit at distance 1 for this view, so dots and spheres agree on size. */
export function sizeDust(dust: Dust, pixelRatio: number, scale: number): void {
  dust.uniforms.uPixelRatio.value = pixelRatio;
  dust.uniforms.uScale.value = scale;
}

/** Births grow over `seconds`; `flash` 0 turns the flash off (reduced motion). */
export function setBirthMotion(dust: Dust, seconds: number, flash: number): void {
  dust.uniforms.uBirthSeconds.value = seconds;
  dust.uniforms.uFlash.value = flash;
}

export function tickDust(dust: Dust, seconds: number): void {
  dust.uniforms.uTime.value = seconds;
}

/** Keeps the dust in step with the universe store. Returns the unsubscribe function. */
export function followUniverse(dust: Dust): () => void {
  const paint = () => {
    const state = useUniverse.getState();
    fillSlots(dust, state.slotCount);
    paintSectors(dust, state.sectors, state.pins);
  };
  paint();
  return useUniverse.subscribe((state, previous) => {
    if (state.version !== previous.version || state.slotCount !== previous.slotCount) paint();
    if (state.births !== previous.births) {
      markBirths(
        dust,
        state.births.filter((birth) => !previous.births.includes(birth)),
      );
    }
  });
}
