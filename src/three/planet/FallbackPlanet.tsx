"use client";

import { useEffect, useMemo } from "react";
import { Color, MeshStandardMaterial } from "three";

import type { WorldParams } from "@convex/shared/worldParams";

import { sharedSphere } from "./materials";

const DETAIL = 24;

/** Shader compile failed (SPEC §8.9): a plain matte sphere in the world's palette. */
export function FallbackPlanet({ params }: { params: WorldParams }) {
  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        color: new Color(params.palette.stops[2]),
        emissive: new Color(params.ocean.color),
        emissiveIntensity: 0.08,
        roughness: 0.8,
        metalness: 0,
      }),
    [params],
  );
  useEffect(
    () => () => {
      material.dispose();
    },
    [material],
  );
  return (
    <group>
      <ambientLight intensity={0.6} />
      <directionalLight position={[-3, 3, 3]} intensity={2} />
      <mesh geometry={sharedSphere(DETAIL)} material={material} />
    </group>
  );
}
