// Bloom levels and their visual unlocks (SPEC §2.4). XP caps arrive with Phase 7.

/** Cumulative XP needed for levels 1 to 10. */
export const LEVEL_XP = [0, 50, 140, 260, 420, 620, 870, 1170, 1520, 2000] as const;
export const MAX_LEVEL = LEVEL_XP.length;

export interface BloomUnlocks {
  /** Clouds always show; level 2 sets them drifting (ADR-019). */
  cloudDrift: boolean;
  glints: boolean;
  vegetation: boolean;
  nightLights: boolean;
  moons: 0 | 1 | 2;
  fireflies: boolean;
  aurora: boolean;
  halo: boolean;
}

export function clampLevel(level: number): number {
  if (!Number.isFinite(level)) return 1;
  return Math.min(MAX_LEVEL, Math.max(1, Math.floor(level)));
}

export function levelForXp(xp: number): number {
  let level = 1;
  for (const [index, needed] of LEVEL_XP.entries()) if (xp >= needed) level = index + 1;
  return level;
}

export function unlocksFor(rawLevel: number): BloomUnlocks {
  const level = clampLevel(rawLevel);
  return {
    cloudDrift: level >= 2,
    glints: level >= 3,
    vegetation: level >= 4,
    nightLights: level >= 5,
    moons: level >= 9 ? 2 : level >= 6 ? 1 : 0,
    fireflies: level >= 7,
    aurora: level >= 8,
    halo: level >= 10,
  };
}
