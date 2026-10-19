"use client";

import { useEffectiveTier } from "@/stores/experience";

import { CameraRig } from "../camera/CameraRig";
import { isRenderTier } from "../quality";
import { GalaxyDust } from "./GalaxyDust";
import { MidWorlds } from "./MidWorlds";
import { NearWorlds } from "./NearWorlds";
import { PerfProbe } from "./PerfProbe";
import { Picker } from "./Picker";
import { ProgramWarmup } from "./ProgramWarmup";
import { useUniverse } from "./store";

/**
 * The universe scene (SPEC §8.4): slot dust and far worlds, mid spheres, near planets, the
 * camera rig and picking. Draw calls: 1 dust + 1 mid + up to 8 per near planet.
 */
export function GalaxyScene() {
  const tier = useEffectiveTier();
  const perf = useUniverse((state) => state.perf);
  if (!isRenderTier(tier)) return null;
  return (
    <>
      <CameraRig />
      <GalaxyDust />
      <MidWorlds tier={tier} />
      <ProgramWarmup tier={tier} />
      <NearWorlds tier={tier} />
      <Picker />
      {perf ? <PerfProbe /> : null}
    </>
  );
}
