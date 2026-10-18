import { gsap } from "gsap";

import { easeName, motion, registerEases } from "@/lib/motion";

import type { PlanetHandle } from "./handle";

// The randomize moment (SPEC §2.2, §3.5): the terrain settles flat while the world turns, the
// new world swaps in at the midpoint, then its terrain rises. One "slow" world moment on the
// shared GSAP ticker. Reduced motion swaps at once.

/** Extra turn during the re-form, in radians. Half a turn reads as "something new". */
const SPIN_BOOST = Math.PI;

let easesReady = false;

function ensureEases(): void {
  if (easesReady) return;
  registerEases(gsap);
  easesReady = true;
}

/** Plays the re-form and calls `swap` at its midpoint. Returns a function that stops it. */
export function playReform(handle: PlanetHandle, swap: () => void, reduced: boolean): () => void {
  if (reduced) {
    swap();
    return () => undefined;
  }
  ensureEases();
  const half = motion.duration.slow / 2;
  const ease = easeName("in-out");
  const timeline = gsap
    .timeline()
    .to(handle, { reform: 1, duration: half, ease })
    .call(swap)
    .to(handle, { reform: 0, duration: half, ease })
    .to(
      handle,
      { yaw: `+=${String(SPIN_BOOST)}`, duration: motion.duration.slow, ease: easeName("out") },
      0,
    );
  return () => {
    timeline.kill();
    handle.reform = 0;
  };
}
