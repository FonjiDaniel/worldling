import { THUMBNAIL_TYPE } from "@convex/shared/worldParams";

// WebP encoding for thumbnails (SPEC §8.7, ADR-022). Browsers that can't encode WebP from a
// canvas (Safari) hand back a PNG instead, so then a small WASM encoder is loaded, once, on demand.

export const WEBP_QUALITY = 0.85;

type Encoder = (image: ImageData, quality: number) => Promise<Blob | null>;

function canvasFor(image: ImageData): OffscreenCanvas | HTMLCanvasElement {
  if (typeof OffscreenCanvas !== "undefined") {
    return new OffscreenCanvas(image.width, image.height);
  }
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  return canvas;
}

/** The browser's own encoder. Returns whatever type the browser chose to produce. */
export const nativeEncoder: Encoder = async (image, quality) => {
  const canvas = canvasFor(image);
  const context = canvas.getContext("2d");
  if (context === null) return null;
  context.putImageData(image, 0, 0);
  if (canvas instanceof HTMLCanvasElement) {
    return await new Promise((resolve) => {
      canvas.toBlob(resolve, THUMBNAIL_TYPE, quality);
    });
  }
  return await canvas.convertToBlob({ type: THUMBNAIL_TYPE, quality });
};

export const wasmEncoder: Encoder = async (image, quality) => {
  const { default: encode } = await import("@jsquash/webp/encode");
  const buffer = await encode(image, { quality: Math.round(quality * 100) });
  return new Blob([buffer], { type: THUMBNAIL_TYPE });
};

/** A WebP blob of `image`, or null when neither encoder could make one. */
export async function encodeWebp(
  image: ImageData,
  encoders: { native: Encoder; wasm: Encoder } = { native: nativeEncoder, wasm: wasmEncoder },
): Promise<Blob | null> {
  const native = await encoders.native(image, WEBP_QUALITY).catch(() => null);
  if (native?.type === THUMBNAIL_TYPE) return native;
  const wasm = await encoders.wasm(image, WEBP_QUALITY).catch(() => null);
  return wasm?.type === THUMBNAIL_TYPE ? wasm : null;
}
