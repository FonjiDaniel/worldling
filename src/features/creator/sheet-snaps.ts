// Snap points for the mobile creator sheet (SPEC §3.6). The world keeps the top 60% of the
// screen at the default snap; "peek" shows just the handle and the main action.

export const SNAPS = ["peek", "half", "full"] as const;
export type Snap = (typeof SNAPS)[number];

/** Share of the viewport height the sheet takes at each open snap. */
const HALF = 0.4;
const FULL = 0.88;
/** A flick faster than this (viewport heights per second) moves one snap that way. */
const FLICK = 1.2;

export type SnapHeights = Record<Snap, number>;

export function snapHeights(viewport: number, peek: number): SnapHeights {
  const full = viewport * FULL;
  const half = Math.min(Math.max(viewport * HALF, peek), full);
  return { peek: Math.min(peek, half), half, full };
}

export function stepSnap(snap: Snap, direction: 1 | -1): Snap {
  const index = SNAPS.indexOf(snap) + direction;
  return SNAPS[Math.min(Math.max(index, 0), SNAPS.length - 1)] ?? snap;
}

/** Where a drag lands: a flick moves one snap, otherwise the closest snap wins. */
export function settleSnap(
  height: number,
  velocity: number,
  heights: SnapHeights,
  from: Snap,
  viewport: number,
): Snap {
  const flick = velocity / viewport;
  if (flick > FLICK) return stepSnap(from, 1);
  if (flick < -FLICK) return stepSnap(from, -1);
  let best: Snap = from;
  for (const snap of SNAPS) {
    if (Math.abs(heights[snap] - height) < Math.abs(heights[best] - height)) best = snap;
  }
  return best;
}
