import {
  type Camera,
  Color,
  type Object3D,
  SRGBColorSpace,
  type WebGLRenderer,
  WebGLRenderTarget,
} from "three";

import { THUMBNAIL_SIZE } from "@convex/shared/worldParams";

// Renders a scene alone into a transparent square target and reads it back (SPEC §8.7). Renderer
// state the views rely on (target, scissor, clear color) is restored afterwards.

const savedClear = new Color();

export function createThumbnailTarget(): WebGLRenderTarget {
  const target = new WebGLRenderTarget(THUMBNAIL_SIZE, THUMBNAIL_SIZE, { samples: 4 });
  // sRGB storage: the GPU encodes on write, so pixels read back match what the canvas shows.
  target.texture.colorSpace = SRGBColorSpace;
  return target;
}

/** Rows come back bottom-up from WebGL; images are top-down. */
export function flipRows(
  pixels: Uint8Array,
  width: number,
  height: number,
): Uint8ClampedArray<ArrayBuffer> {
  const row = width * 4;
  const out = new Uint8ClampedArray(new ArrayBuffer(pixels.length));
  for (let y = 0; y < height; y += 1) {
    out.set(pixels.subarray(y * row, (y + 1) * row), (height - 1 - y) * row);
  }
  return out;
}

export function renderThumbnail(
  gl: WebGLRenderer,
  scene: Object3D,
  camera: Camera,
  target: WebGLRenderTarget,
): ImageData {
  const previousTarget = gl.getRenderTarget();
  const scissor = gl.getScissorTest();
  const alpha = gl.getClearAlpha();
  gl.getClearColor(savedClear);
  try {
    gl.setRenderTarget(target);
    gl.setScissorTest(false);
    gl.setClearColor(0x000000, 0);
    gl.clear(true, true, true);
    gl.render(scene, camera);
    const { width, height } = target;
    const pixels = new Uint8Array(width * height * 4);
    gl.readRenderTargetPixels(target, 0, 0, width, height, pixels);
    return new ImageData(flipRows(pixels, width, height), width, height);
  } finally {
    gl.setRenderTarget(previousTarget);
    gl.setScissorTest(scissor);
    gl.setClearColor(savedClear, alpha);
  }
}
