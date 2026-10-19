"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { AdditiveBlending, ShaderMaterial } from "three";

import { readArtColors } from "../art";
import { worldTime } from "../clock";
import type { RenderTier } from "../quality";
import type { PlanetHandle } from "./handle";
import { cometFragment, cometVertex } from "../shaders/comets";
import { COMET_LIMIT, createCometGeometry, createCometUniforms, tickComets } from "./comets";

interface CometStreaksProps {
  /** Comet ids, newest first. */
  ids: readonly string[];
  tier: RenderTier;
  /** Read every frame: a pinned time (thumbnails, frozen renders) or the shared clock. */
  handle: Readonly<PlanetHandle>;
}

export function CometStreaks({ ids, tier, handle }: CometStreaksProps) {
  const dpr = useThree((state) => state.viewport.dpr);
  const key = ids.slice(0, COMET_LIMIT[tier]).join(",");
  const geometry = useMemo(() => createCometGeometry(key === "" ? [] : key.split(",")), [key]);
  const uniforms = useMemo(() => createCometUniforms(readArtColors().comet), []);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms,
        vertexShader: cometVertex,
        fragmentShader: cometFragment,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    [uniforms],
  );
  useEffect(
    () => () => {
      geometry.dispose();
    },
    [geometry],
  );
  useEffect(
    () => () => {
      material.dispose();
    },
    [material],
  );
  useFrame(() => {
    tickComets(uniforms, handle.time ?? worldTime(), dpr);
  });
  if (key === "") return null;
  return <points geometry={geometry} material={material} renderOrder={6} />;
}
