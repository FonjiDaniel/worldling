import { beforeEach, describe, expect, it } from "vitest";

import type { Id } from "@convex/_generated/dataModel";
import { sectorKeyForSlot } from "@convex/shared/galaxy";

import { SECTOR_CACHE, type SectorPin, useUniverse } from "./store";

const pin = (slot: number): SectorPin => ({
  id: `world${String(slot)}` as Id<"worlds">,
  slot,
  name: `World ${String(slot)}`,
  username: `user_${String(slot)}`,
  colorA: "#aabbcc",
  colorB: "#ccbbaa",
  level: 1,
});

beforeEach(() => {
  useUniverse.getState().reset();
});

describe("universe store", () => {
  it("places pins on their slot and sector", () => {
    useUniverse.getState().loadSector(sectorKeyForSlot(0), [pin(0)]);
    const placed = useUniverse.getState().pins.get(0);
    expect(placed?.sectorKey).toBe(sectorKeyForSlot(0));
    expect(useUniverse.getState().version).toBe(1);
  });

  it("treats new pins in a loaded sector as births, not first loads", () => {
    const { loadSector } = useUniverse.getState();
    loadSector("0:0", [pin(1)]);
    expect(useUniverse.getState().births).toEqual([]);
    loadSector("0:0", [pin(1), pin(2)]);
    expect(useUniverse.getState().births.map((birth) => birth.pin.slot)).toEqual([2]);
  });

  it("drops pins that left a sector", () => {
    const { loadSector } = useUniverse.getState();
    loadSector("0:0", [pin(1), pin(2)]);
    loadSector("0:0", [pin(2)]);
    expect([...useUniverse.getState().pins.keys()]).toEqual([2]);
  });

  it("evicts the least recently used sectors past the cache size", () => {
    const { loadSector } = useUniverse.getState();
    for (let i = 0; i <= SECTOR_CACHE; i += 1) loadSector(`${String(i)}:0`, [pin(i)]);
    const { sectors, pins } = useUniverse.getState();
    expect(sectors.size).toBe(SECTOR_CACHE);
    expect(sectors.has("0:0")).toBe(false);
    expect(pins.has(0)).toBe(false);
    expect(pins.has(SECTOR_CACHE)).toBe(true);
  });

  it("keeps renderables only for worlds still near", () => {
    const { setRenderables } = useUniverse.getState();
    const params = {} as never;
    const a = "a" as Id<"worlds">;
    const b = "b" as Id<"worlds">;
    setRenderables([{ id: a, params, level: 1 }], new Set([a]));
    setRenderables([{ id: b, params, level: 2 }], new Set([b]));
    expect([...useUniverse.getState().renderables.keys()]).toEqual([b]);
  });
});
