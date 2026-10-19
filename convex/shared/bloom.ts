// Bloom levels, visual unlocks, XP rewards and daily caps (SPEC §2.4, ADR-023).

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

/** XP per source and how many of each count per world per UTC day (SPEC §2.4). */
export const XP = {
  tend: 10,
  visit: 2,
  cometReceived: 5,
  cometSent: 1,
} as const;

export const DAILY_CAPS = {
  /** Unique visitors that earn XP. */
  visits: 20,
  /** Comets that earn XP, one per author. */
  cometsReceived: 10,
  /** Comets sent that earn the sender's world XP. */
  cometsSent: 5,
} as const;

export const STREAK_BONUS_MAX = 5;

/**
 * The streak after tending on `day`. A tend the day after the last one extends it, any gap
 * starts over at 1. Only the bonus resets; XP is never lost.
 */
export function streakAfter(
  lastTendedDay: string | undefined,
  yesterday: string,
  streak: number,
): number {
  return lastTendedDay === yesterday ? streak + 1 : 1;
}

/** +1 per consecutive day after the first, up to +5 (ADR-023). */
export function streakBonus(streak: number): number {
  return Math.min(Math.max(streak - 1, 0), STREAK_BONUS_MAX);
}

export interface BloomProgress {
  level: number;
  /** XP where the current level starts. */
  levelXp: number;
  /** XP where the next level starts, or null at the top level. */
  nextXp: number | null;
  /** 0 to 1 through the current level; 1 at the top level. */
  fraction: number;
}

export function progressFor(rawXp: number): BloomProgress {
  const xp = Math.max(0, Number.isFinite(rawXp) ? rawXp : 0);
  const level = levelForXp(xp);
  const levelXp = LEVEL_XP[level - 1] ?? 0;
  const nextXp = LEVEL_XP[level] ?? null;
  const fraction = nextXp === null ? 1 : (xp - levelXp) / (nextXp - levelXp);
  return { level, levelXp, nextXp, fraction };
}
