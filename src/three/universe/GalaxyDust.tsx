"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";

import { motion } from "@/lib/motion";
import { useExperience } from "@/stores/experience";

import { readArtColors } from "../art";
import {
  createDust,
  disposeDust,
  dustCapacity,
  followUniverse,
  setBirthMotion,
  sizeDust,
  tickDust,
} from "./dust";
import { CAMERA_FOV } from "./scale";
import { useUniverse } from "./store";

const HALF_FOV_TAN = Math.tan(((CAMERA_FOV / 2) * Math.PI) / 180);

/** Far LOD and slot dust: every slot in one draw call (SPEC §8.4, ADR-024). */
export function GalaxyDust() {
  const slotCount = useUniverse((state) => state.slotCount);
  const capacity = dustCapacity(slotCount);
  const dust = useMemo(() => createDust(capacity, readArtColors().star), [capacity]);
  const height = useThree((state) => state.size.height);
  const dpr = useThree((state) => state.viewport.dpr);
  const reduced = useExperience((state) => state.reducedMotion);

  useEffect(
    () => () => {
      disposeDust(dust);
    },
    [dust],
  );
  useEffect(() => {
    sizeDust(dust, dpr, height / 2 / HALF_FOV_TAN);
  }, [dust, dpr, height]);
  useEffect(() => {
    // Reduced motion: the short reduced fade, no flash (05, §3.5).
    if (reduced) setBirthMotion(dust, motion.duration.reduced, 0);
    else setBirthMotion(dust, motion.duration.bloom, 1);
  }, [dust, reduced]);
  useEffect(() => followUniverse(dust), [dust]);
  useFrame(() => {
    tickDust(dust, performance.now() / 1000);
  });

  return <primitive object={dust.points} />;
}
