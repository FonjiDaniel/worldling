import { describe, expect, it, vi } from "vitest";

import { flipRows } from "./captureThumbnail";
import { encodeWebp } from "./encodeWebp";

const image = { width: 1, height: 1, data: new Uint8ClampedArray(4) } as unknown as ImageData;
const blob = (type: string) => new Blob(["x"], { type });

describe("encodeWebp", () => {
  it("keeps the browser's WebP", async () => {
    const wasm = vi.fn();
    const result = await encodeWebp(image, {
      native: () => Promise.resolve(blob("image/webp")),
      wasm,
    });
    expect(result?.type).toBe("image/webp");
    expect(wasm).not.toHaveBeenCalled();
  });

  it("falls back to WASM when the browser hands back a PNG (Safari)", async () => {
    const result = await encodeWebp(image, {
      native: () => Promise.resolve(blob("image/png")),
      wasm: () => Promise.resolve(blob("image/webp")),
    });
    expect(result?.type).toBe("image/webp");
  });

  it("gives up with null when nothing can make a WebP", async () => {
    const result = await encodeWebp(image, {
      native: () => Promise.reject(new Error("no canvas")),
      wasm: () => Promise.reject(new Error("no wasm")),
    });
    expect(result).toBeNull();
  });
});

describe("flipRows", () => {
  it("turns WebGL's bottom-up rows into top-down rows", () => {
    const pixels = new Uint8Array([1, 1, 1, 1, 2, 2, 2, 2]);
    expect(Array.from(flipRows(pixels, 1, 2))).toEqual([2, 2, 2, 2, 1, 1, 1, 1]);
  });
});
