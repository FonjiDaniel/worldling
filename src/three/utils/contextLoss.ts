import { reportError } from "@/lib/logger";
import { useExperience } from "@/stores/experience";

// WebGL context loss (SPEC §8.9): show the overlay, let the browser restore, and after two
// failures fall back to tier 0 for the rest of the session.

export const MAX_CONTEXT_LOSSES = 2;
const RESTORE_TIMEOUT_S = 5;

export function watchContextLoss(canvas: HTMLCanvasElement): () => void {
  let losses = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const { setWebgl } = useExperience.getState();

  const fail = (reason: string) => {
    clearTimeout(timer);
    setWebgl("failed");
    const { gpu } = useExperience.getState();
    reportError(new Error(`WebGL context ${reason}`), {
      fn: "three:context",
      tags: { losses, gpu },
    });
  };

  const onLost = (event: Event) => {
    // A disposed canvas (unmount, tier change) is already out of the page: not a real loss.
    if (!canvas.isConnected) return;
    event.preventDefault();
    losses += 1;
    if (losses >= MAX_CONTEXT_LOSSES) {
      fail("lost twice");
      return;
    }
    setWebgl("lost");
    timer = setTimeout(() => {
      fail("not restored");
    }, RESTORE_TIMEOUT_S * 1000);
  };

  const onRestored = () => {
    clearTimeout(timer);
    if (useExperience.getState().webgl === "lost") setWebgl("ok");
  };

  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);
  return () => {
    clearTimeout(timer);
    canvas.removeEventListener("webglcontextlost", onLost);
    canvas.removeEventListener("webglcontextrestored", onRestored);
  };
}
