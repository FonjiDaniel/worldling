import { gsap } from "gsap";

// The single animation clock (ADR-003). gsap.ticker drives R3F (frameloop "never" + advance)
// and, from Phase 11, Lenis. World time only moves while ambient motion is running, so pausing
// stops planets without stopping rendering.

export type FrameListener = (timeMs: number) => void;

/** Ambient motion speed with prefers-reduced-motion (SPEC §3.5: slow, never stopped). */
export const REDUCED_MOTION_RATE = 0.35;
const MAX_STEP_S = 0.1;

const listeners = new Set<FrameListener>();
let worldSeconds = 0;
let rate = 1;
let frozenAt: number | null = null;

function tick(timeS: number, deltaMs: number): void {
  if (frozenAt === null) worldSeconds += Math.min(deltaMs / 1000, MAX_STEP_S) * rate;
  const timeMs = timeS * 1000;
  for (const listener of listeners) listener(timeMs);
}

/** Runs a listener on every frame. Returns the unsubscribe function. */
export function subscribeFrame(listener: FrameListener): () => void {
  if (listeners.size === 0) gsap.ticker.add(tick);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) gsap.ticker.remove(tick);
  };
}

/** Seconds of ambient world motion: rotation, clouds, orbits. */
export function worldTime(): number {
  return frozenAt ?? worldSeconds;
}

/** 0 pauses ambient motion, 1 is full speed. */
export function setMotionRate(next: number): void {
  rate = Math.max(0, next);
}

/** Pins world time, for deterministic screenshots. null resumes. */
export function freezeWorldTime(at: number | null): void {
  frozenAt = at;
}
