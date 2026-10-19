import type { RenderTier } from "../quality";

// Pure LOD selection for the universe (SPEC §8.4). Allocates, so call it from a timer, never
// from useFrame.

export interface Placed {
  slot: number;
  x: number;
  y: number;
  z: number;
}

const distanceSq = (a: Placed, x: number, y: number, z: number): number =>
  (a.x - x) ** 2 + (a.y - y) ** 2 + (a.z - z) ** 2;

/** The `count` placed items closest to (x, y, z) and within `maxDistance`, nearest first. */
export function nearest<T extends Placed>(
  items: Iterable<T>,
  x: number,
  y: number,
  z: number,
  count: number,
  maxDistance = Number.POSITIVE_INFINITY,
): T[] {
  if (count <= 0) return [];
  const limit = maxDistance ** 2;
  const scored: { item: T; d: number }[] = [];
  for (const item of items) {
    const d = distanceSq(item, x, y, z);
    if (d <= limit) scored.push({ item, d });
  }
  scored.sort((a, b) => a.d - b.d || a.item.slot - b.item.slot);
  return scored.slice(0, count).map((entry) => entry.item);
}

/**
 * The next near set: keeps worlds already shown while they stay within the closest
 * `count * keepFactor`, so a world doesn't pop between full planet and mid sphere at the edge.
 */
export function selectNear(
  previous: readonly number[],
  ranked: readonly number[],
  count: number,
  keepFactor = 1.5,
): number[] {
  const keepRange = new Set(ranked.slice(0, Math.ceil(count * keepFactor)));
  const kept = previous.filter((slot) => keepRange.has(slot)).slice(0, count);
  const next = [...kept];
  for (const slot of ranked) {
    if (next.length >= count) break;
    if (!next.includes(slot)) next.push(slot);
  }
  return next;
}

/** The planet tier for the near world at `index` (closest first). */
export function nearPlanetTier(tier: RenderTier, index: number): RenderTier {
  // Only tier 3 draws the closest world at full detail. Elsewhere the universe is a place to
  // browse, so every world uses the lightest planet and its own page shows the full one
  // (05: small worlds need silhouette and color masses, not fine detail).
  return tier === 3 && index === 0 ? 3 : 1;
}
