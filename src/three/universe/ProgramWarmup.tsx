"use client";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { Mesh, Points, Scene } from "three";

import { reportError } from "@/lib/logger";

import {
  createPlanetMaterials,
  createPlanetUniforms,
  disposeMaterials,
  type PlanetMaterials,
  sharedSphere,
} from "../planet/materials";
import { createFireflyGeometry } from "../planet/orbitals";
import { type RenderTier, TIERS } from "../quality";

// Full planets come and go as the camera moves (SPEC §8.4). Every planet at one octave count
// shares the same shader programs, so compiling them once up front and holding one material set
// keeps three from releasing and recompiling them on every arrival (a visible stall).

function warmScene(materials: PlanetMaterials) {
  const scene = new Scene();
  const sphere = sharedSphere(1);
  const fireflies = createFireflyGeometry(1);
  const { fireflies: fireflyMaterial, ...meshes } = materials;
  for (const material of Object.values(meshes)) scene.add(new Mesh(sphere, material));
  scene.add(new Points(fireflies, fireflyMaterial));
  return { scene, fireflies };
}

export function ProgramWarmup({ tier }: { tier: RenderTier }) {
  const gl = useThree((state) => state.gl);
  const camera = useThree((state) => state.camera);

  useEffect(() => {
    const octaves = [...new Set([TIERS[tier === 3 ? 3 : 1].octaves, TIERS[1].octaves])];
    const sets = octaves.map((count) => createPlanetMaterials(createPlanetUniforms(), count));
    const scenes = sets.map(warmScene);
    for (const { scene } of scenes) {
      gl.compileAsync(scene, camera).catch((error: unknown) => {
        reportError(error, { fn: "universe.warmup", tags: { tier } });
      });
    }
    return () => {
      for (const set of sets) disposeMaterials(set);
      for (const { fireflies } of scenes) fireflies.dispose();
    };
  }, [gl, camera, tier]);

  return null;
}
