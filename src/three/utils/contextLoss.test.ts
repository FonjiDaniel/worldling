import { afterEach, describe, expect, it, vi } from "vitest";

import { useExperience } from "@/stores/experience";

import { watchContextLoss } from "./contextLoss";

vi.mock("@/lib/logger", () => ({ reportError: vi.fn() }));

afterEach(() => {
  useExperience.setState({ webgl: "ok" });
  document.body.replaceChildren();
});

const lose = (canvas: HTMLCanvasElement) =>
  canvas.dispatchEvent(new Event("webglcontextlost", { cancelable: true }));

describe("watchContextLoss", () => {
  it("shows the overlay when a live canvas loses its context", () => {
    const canvas = document.body.appendChild(document.createElement("canvas"));
    const stop = watchContextLoss(canvas);
    lose(canvas);
    expect(useExperience.getState().webgl).toBe("lost");
    stop();
  });

  it("ignores the loss a disposed canvas fires when it's removed", () => {
    const canvas = document.createElement("canvas");
    const stop = watchContextLoss(canvas);
    lose(canvas);
    expect(useExperience.getState().webgl).toBe("ok");
    stop();
  });

  it("stops listening once stopped", () => {
    const canvas = document.body.appendChild(document.createElement("canvas"));
    watchContextLoss(canvas)();
    lose(canvas);
    expect(useExperience.getState().webgl).toBe("ok");
  });
});
