"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { sectorDistance, sectorKeyFor } from "@convex/shared/galaxy";

import { toast } from "@/components/ui/toaster";
import { type Birth, useUniverse } from "@/three/universe/store";

import { copy } from "./copy";

// "Just born" (SPEC §2.5): a toast when a world appears near the camera in real time. At most
// one every 10 seconds, so a busy hour never floods the screen.

const NEARBY_SECTORS = 2;
const TOAST_GAP_MS = 10_000;

export function useBirthToasts(): void {
  const router = useRouter();
  useEffect(() => {
    let seen: readonly Birth[] = useUniverse.getState().births;
    let last = 0;
    const point = { x: 0, z: 0 };
    return useUniverse.subscribe((state) => {
      if (state.births === seen) return;
      const fresh = state.births.filter((birth) => !seen.includes(birth));
      seen = state.births;
      if (!state.live || state.rig === null || Date.now() - last < TOAST_GAP_MS) return;
      state.rig.groundPoint(point);
      const here = sectorKeyFor(point.x, point.z);
      const near = fresh.find(
        (birth) => sectorDistance(birth.pin.sectorKey, here) <= NEARBY_SECTORS,
      );
      if (near === undefined) return;
      last = Date.now();
      toast(copy.born(near.pin.name), {
        action: {
          label: copy.bornAction,
          onClick: () => {
            router.push(`/w/${near.pin.username}`);
          },
        },
      });
    });
  }, [router]);
}
