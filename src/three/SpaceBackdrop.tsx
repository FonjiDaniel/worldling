"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import {
  BufferAttribute,
  BufferGeometry,
  Mesh,
  OrthographicCamera,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  type WebGLRenderer,
} from "three";

import { hexToRgb } from "@convex/shared/color";

import { readArtColors } from "./art";
import { backdropFragment, backdropVertex } from "./shaders/backdrop";

/** Runs first each frame: clears the canvas to quiet space, then views draw on top. */
const BACKDROP_PRIORITY = 0;

function createBackdrop() {
  const art = readArtColors();
  // sRGB on purpose: the tints mix like the CSS --space-backdrop they mirror.
  const color = (hex: string) => new Vector3(...hexToRgb(hex));
  const geometry = new BufferGeometry();
  // One oversized triangle covers the screen with no seam.
  const triangle = new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]);
  geometry.setAttribute("position", new BufferAttribute(triangle, 3));
  const resolution = { value: new Vector2(1, 1) };
  const pixelRatio = { value: 1 };
  const material = new ShaderMaterial({
    vertexShader: backdropVertex,
    fragmentShader: backdropFragment,
    depthWrite: false,
    depthTest: false,
    uniforms: {
      uResolution: resolution,
      uPixelRatio: pixelRatio,
      uSpace: { value: color(art.space) },
      uNebula: { value: color(art.nebula) },
      uAurora: { value: color(art.aurora) },
      uStar: { value: color(art.star) },
    },
  });
  const mesh = new Mesh(geometry, material);
  mesh.frustumCulled = false;
  const scene = new Scene();
  scene.add(mesh);
  return { scene, camera: new OrthographicCamera(), geometry, material, resolution, pixelRatio };
}

type Backdrop = ReturnType<typeof createBackdrop>;

function resize(backdrop: Backdrop, width: number, height: number, dpr: number): void {
  backdrop.resolution.value.set(width * dpr, height * dpr);
  backdrop.pixelRatio.value = dpr;
}

function dispose(backdrop: Backdrop): void {
  backdrop.geometry.dispose();
  backdrop.material.dispose();
}

/** Views leave the viewport on their own box, so reset it to the full canvas first. */
function draw(gl: WebGLRenderer, backdrop: Backdrop, width: number, height: number): void {
  gl.setScissorTest(false);
  gl.setViewport(0, 0, width, height);
  gl.autoClear = true;
  gl.render(backdrop.scene, backdrop.camera);
}

export function SpaceBackdrop() {
  const backdrop = useMemo(() => createBackdrop(), []);
  const size = useThree((state) => state.size);
  const dpr = useThree((state) => state.viewport.dpr);

  useEffect(() => {
    resize(backdrop, size.width, size.height, dpr);
  }, [backdrop, size, dpr]);
  useEffect(
    () => () => {
      dispose(backdrop);
    },
    [backdrop],
  );
  useFrame(({ gl, size: { width, height } }) => {
    draw(gl, backdrop, width, height);
  }, BACKDROP_PRIORITY);

  return null;
}
