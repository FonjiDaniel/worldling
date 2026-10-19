"use client";

import { Planet } from "../planet/Planet";
import type { RenderTier } from "../quality";
import { WORLD_RADIUS } from "./scale";
import { nearPlanetTier } from "./selection";
import { useUniverse } from "./store";

/**
 * Near LOD (SPEC §8.4): the closest few worlds as full planets, once their params arrive.
 * Each Planet disposes its own materials; geometries are shared per detail.
 */
export function NearWorlds({ tier }: { tier: RenderTier }) {
  const nearSlots = useUniverse((state) => state.nearSlots);
  const pins = useUniverse((state) => state.pins);
  const renderables = useUniverse((state) => state.renderables);
  useUniverse((state) => state.version);

  return (
    <>
      {nearSlots.map((slot, index) => {
        const pin = pins.get(slot);
        const world = pin === undefined ? undefined : renderables.get(pin.id);
        if (pin === undefined || world === undefined) return null;
        return (
          <group key={pin.id} position={[pin.x, pin.y, pin.z]} scale={WORLD_RADIUS}>
            <Planet params={world.params} level={world.level} tier={nearPlanetTier(tier, index)} />
          </group>
        );
      })}
    </>
  );
}
