"use client";

import { useQuery } from "convex/react";
import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";

import type { Id } from "@convex/_generated/dataModel";
import { api } from "@convex/_generated/api";
import { neighborSectors, sectorKeyFor } from "@convex/shared/galaxy";

import { LOD_INTERVAL_MS, STREAM_DEBOUNCE_MS } from "@/three/universe/scale";
import { useUniverse } from "@/three/universe/store";

// Feeds the universe store from Convex (SPEC §8.4, ADR-012): the slot count, one subscription
// per sector around the camera, and full params for the near worlds.

function SectorQuery({ sectorKey }: { sectorKey: string }) {
  const pins = useQuery(api.universe.sectors, { keys: [sectorKey] });
  useEffect(() => {
    if (pins !== undefined) useUniverse.getState().loadSector(sectorKey, pins);
  }, [pins, sectorKey]);
  return null;
}

/** Follows the camera's ground point; sectors change once it has settled (STREAM_DEBOUNCE_MS). */
function useFollowCamera(): void {
  useEffect(() => {
    const point = { x: 0, z: 0 };
    let settled = "";
    let pending = "";
    let timer = 0;
    if (useUniverse.getState().wanted.length === 0) {
      useUniverse.getState().setWanted(neighborSectors(0, 0));
    }
    const poll = window.setInterval(() => {
      const { rig } = useUniverse.getState();
      if (rig === null) return;
      rig.groundPoint(point);
      const key = sectorKeyFor(point.x, point.z);
      if (key === settled || key === pending) return;
      pending = key;
      window.clearTimeout(timer);
      const { x, z } = point;
      timer = window.setTimeout(() => {
        settled = key;
        useUniverse.getState().setWanted(neighborSectors(x, z));
      }, STREAM_DEBOUNCE_MS);
    }, LOD_INTERVAL_MS);
    return () => {
      window.clearInterval(poll);
      window.clearTimeout(timer);
    };
  }, []);
}

function nearIds(state: ReturnType<typeof useUniverse.getState>): Id<"worlds">[] {
  const ids: Id<"worlds">[] = [];
  for (const slot of state.nearSlots) {
    const pin = state.pins.get(slot);
    if (pin) ids.push(pin.id);
  }
  return ids.sort();
}

function NearParams() {
  const ids = useUniverse(useShallow(nearIds));
  const worlds = useQuery(api.universe.renderable, ids.length === 0 ? "skip" : { ids });
  useEffect(() => {
    if (worlds !== undefined) useUniverse.getState().setRenderables(worlds, new Set(ids));
  }, [worlds, ids]);
  return null;
}

export function UniverseData() {
  const overview = useQuery(api.universe.overview, {});
  const wanted = useUniverse((state) => state.wanted);
  useFollowCamera();
  useEffect(() => {
    if (overview) useUniverse.getState().setOverview(overview.slotCount, overview.live);
  }, [overview]);
  useEffect(
    () => () => {
      useUniverse.getState().reset();
    },
    [],
  );
  return (
    <>
      {wanted.map((key) => (
        <SectorQuery key={key} sectorKey={key} />
      ))}
      <NearParams />
    </>
  );
}
