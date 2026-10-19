"use client";

import { useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { InstancedBufferAttribute, InstancedMesh, Matrix4, ShaderMaterial, Vector3 } from "three";

import { hexToLinear } from "@convex/shared/color";

import { readArtColors } from "../art";
import { sharedSphere } from "../planet/materials";
import { sceneLight } from "../planet/uniforms";
import { type RenderTier, TIERS } from "../quality";
import { midFragment, midVertex } from "../shaders/galaxy";
import { LOD_INTERVAL_MS, MID_RANGE, NEAR_RANGE, WORLD_RADIUS } from "./scale";
import { nearest, selectNear } from "./selection";
import { useUniverse } from "./store";

// Mid LOD (SPEC §8.4): the closest loaded worlds as low-detail spheres in one instanced draw.
// A timer, not useFrame, ranks worlds by distance; it also picks the near set for full planets.

const MID_DETAIL = 2;

function createMid(capacity: number) {
  const art = readArtColors();
  const light = sceneLight(art);
  const material = new ShaderMaterial({
    vertexShader: midVertex,
    fragmentShader: midFragment,
    uniforms: {
      uKeyDir: { value: new Vector3(...light.keyDir) },
      uKey: { value: new Vector3(...light.key) },
      uFillDir: { value: new Vector3(...light.fillDir) },
      uFill: { value: new Vector3(...light.fill) },
    },
  });
  const geometry = sharedSphere(MID_DETAIL).clone();
  const colorA = new InstancedBufferAttribute(new Float32Array(capacity * 3), 3);
  const colorB = new InstancedBufferAttribute(new Float32Array(capacity * 3), 3);
  geometry.setAttribute("aColorA", colorA);
  geometry.setAttribute("aColorB", colorB);
  const mesh = new InstancedMesh(geometry, material, capacity);
  mesh.count = 0;
  mesh.frustumCulled = false;
  return { mesh, geometry, material, colorA, colorB };
}

type Mid = ReturnType<typeof createMid>;

const matrix = new Matrix4();
const hidden = new Matrix4().makeScale(0, 0, 0);

function updateMid(mid: Mid, camera: Vector3, tier: RenderTier): void {
  const { pins, nearSlots, renderables, setNearSlots } = useUniverse.getState();
  const { midLod, nearLod } = TIERS[tier];
  const ranked = nearest(pins.values(), camera.x, camera.y, camera.z, midLod, MID_RANGE);
  const closeBy = nearest(ranked, camera.x, camera.y, camera.z, nearLod * 2, NEAR_RANGE);
  const near = selectNear(
    nearSlots,
    closeBy.map((pin) => pin.slot),
    nearLod,
  );
  // Closest first: NearWorlds draws only the first at the full tier.
  const rank = new Map(closeBy.map((pin, index) => [pin.slot, index]));
  near.sort((a, b) => (rank.get(a) ?? near.length) - (rank.get(b) ?? near.length));
  setNearSlots(near);
  const nearSet = new Set(near);
  ranked.forEach((pin, index) => {
    // A near world keeps its sphere until its full planet has params to draw.
    if (nearSet.has(pin.slot) && renderables.has(pin.id)) mid.mesh.setMatrixAt(index, hidden);
    else {
      matrix.makeScale(WORLD_RADIUS, WORLD_RADIUS, WORLD_RADIUS).setPosition(pin.x, pin.y, pin.z);
      mid.mesh.setMatrixAt(index, matrix);
    }
    mid.colorA.array.set(hexToLinear(pin.colorA), index * 3);
    mid.colorB.array.set(hexToLinear(pin.colorB), index * 3);
  });
  mid.mesh.count = ranked.length;
  mid.mesh.instanceMatrix.needsUpdate = true;
  mid.colorA.needsUpdate = true;
  mid.colorB.needsUpdate = true;
}

export function MidWorlds({ tier }: { tier: RenderTier }) {
  const capacity = TIERS[tier].midLod;
  const mid = useMemo(() => createMid(capacity), [capacity]);
  const camera = useThree((state) => state.camera);

  useEffect(
    () => () => {
      mid.geometry.dispose();
      mid.material.dispose();
      mid.mesh.dispose();
    },
    [mid],
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      updateMid(mid, camera.position, tier);
    }, LOD_INTERVAL_MS);
    return () => {
      window.clearInterval(timer);
    };
  }, [mid, camera, tier]);

  return <primitive object={mid.mesh} />;
}
