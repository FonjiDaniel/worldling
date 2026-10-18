"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import type { Group, Mesh } from "three";

import type { WorldParams } from "@convex/shared/worldParams";

import { useExperience } from "@/stores/experience";

import { readArtColors } from "../art";
import { worldTime } from "../clock";
import { type RenderTier, TIERS } from "../quality";
import { ATMOSPHERE_RADIUS } from "../shaders/sky";
import { FallbackPlanet } from "./FallbackPlanet";
import {
  applyUniforms,
  createPlanetMaterials,
  createPlanetUniforms,
  disposeMaterials,
  sharedSphere,
  tickUniforms,
} from "./materials";
import { createFireflyGeometry, moonOrbits, placeMoon } from "./orbitals";
import { paramsToUniforms } from "./uniforms";

export interface PlanetProps {
  params: WorldParams;
  level: number;
  tier: RenderTier;
}

const CLOUD_LIFT = 0.035;
const AURORA_RADIUS = 1.13;
const SHELL_DETAIL = 24;
const MOON_DETAIL = 3;

/** Every planet layer from SPEC §2.3, driven by paramsToUniforms. */
export function Planet(props: PlanetProps) {
  const shaderFailed = useExperience((state) => state.shaderFailed);
  if (shaderFailed) return <FallbackPlanet params={props.params} />;
  return <ShaderPlanet {...props} />;
}

function ShaderPlanet({ params, level, tier }: PlanetProps) {
  const dpr = useThree((state) => state.viewport.dpr);
  const data = useMemo(
    () => paramsToUniforms(params, tier, level, readArtColors()),
    [params, tier, level],
  );
  const uniforms = useMemo(() => createPlanetUniforms(), []);
  const materials = useMemo(
    () => createPlanetMaterials(uniforms, data.octaves),
    [uniforms, data.octaves],
  );
  const fireflies = useMemo(() => createFireflyGeometry(params.seed), [params.seed]);
  const orbits = useMemo(() => moonOrbits(params.seed), [params.seed]);
  const spin = useRef<Group>(null);
  const moonA = useRef<Mesh>(null);
  const moonB = useRef<Mesh>(null);

  useEffect(() => {
    applyUniforms(uniforms, data, { glow: TIERS[tier].bloom ? 1 : 0, pixelRatio: dpr });
  }, [uniforms, data, tier, dpr]);
  useEffect(
    () => () => {
      disposeMaterials(materials);
    },
    [materials],
  );
  useEffect(
    () => () => {
      fireflies.dispose();
    },
    [fireflies],
  );

  useFrame(() => {
    const time = worldTime();
    tickUniforms(uniforms, time, data.cloudDrift);
    if (spin.current) spin.current.rotation.y = time * data.spinRate;
    const orbitAngle = time * data.orbitRate;
    if (moonA.current) placeMoon(moonA.current, orbits[0], orbitAngle);
    if (moonB.current) placeMoon(moonB.current, orbits[1], orbitAngle);
  });

  const sphere = sharedSphere(data.detail);
  const shell = sharedSphere(SHELL_DETAIL);
  const moon = sharedSphere(MOON_DETAIL);
  const cloudRadius = 1 + data.amplitude * 0.75 + CLOUD_LIFT;

  return (
    <group rotation-z={data.tilt}>
      <group ref={spin}>
        <mesh geometry={sphere} material={materials.surface} />
        {data.seaLevel > 0 ? (
          <mesh geometry={sphere} material={materials.ocean} renderOrder={1} />
        ) : null}
        <mesh
          geometry={shell}
          material={materials.clouds}
          scale={cloudRadius}
          renderOrder={2}
          visible={data.coverage > 0}
        />
        {data.features.aurora ? (
          <mesh
            geometry={shell}
            material={materials.aurora}
            scale={AURORA_RADIUS}
            renderOrder={3}
          />
        ) : null}
      </group>
      <mesh
        geometry={shell}
        material={materials.atmosphere}
        scale={ATMOSPHERE_RADIUS}
        renderOrder={4}
      />
      {data.moons >= 1 ? (
        <mesh ref={moonA} geometry={moon} material={materials.moon} scale={orbits[0].size} />
      ) : null}
      {data.moons >= 2 ? (
        <mesh ref={moonB} geometry={moon} material={materials.moon} scale={orbits[1].size} />
      ) : null}
      {data.fireflies ? (
        <points geometry={fireflies} material={materials.fireflies} renderOrder={5} />
      ) : null}
    </group>
  );
}
