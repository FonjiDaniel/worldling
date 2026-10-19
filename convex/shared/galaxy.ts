import { hash01 } from "./random";

// Galaxy layout (SPEC §8.4): world N sits on a Vogel spiral at slot N, forever. Started minimal
// in Phase 4 so onboarding can place a world; Phase 8 adds the streaming helpers.

export const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
export const SPACING = 6; // world units, tune visually
export const SECTOR_SIZE = 120; // world units per sector edge

export function slotToPosition(slot: number): { x: number; y: number; z: number } {
  const r = SPACING * Math.sqrt(slot + 1);
  const theta = slot * GOLDEN_ANGLE;
  const y = (hash01(slot) - 0.5) * 8 * Math.exp(-r / 600); // thin disc, thicker in the core
  return { x: r * Math.cos(theta), y, z: r * Math.sin(theta) };
}

export const sectorKeyFor = (x: number, z: number): string =>
  `${String(Math.floor(x / SECTOR_SIZE))}:${String(Math.floor(z / SECTOR_SIZE))}`;

export function sectorKeyForSlot(slot: number): string {
  const { x, z } = slotToPosition(slot);
  return sectorKeyFor(x, z);
}

// Streaming helpers (Phase 8, ADR-012): the camera's ground point picks a 3x3 block of sectors.

/** Sectors one `universe.sectors` call may ask for (§5.5). */
export const MAX_SECTORS = 9;

const SECTOR_KEY = /^-?\d{1,6}:-?\d{1,6}$/;

export const isSectorKey = (key: string): boolean => SECTOR_KEY.test(key);

/** Sector indices for a key, or null for anything that isn't one. */
export function sectorCoords(key: string): { sx: number; sz: number } | null {
  if (!isSectorKey(key)) return null;
  const [sx = 0, sz = 0] = key.split(":").map(Number);
  return { sx, sz };
}

/** World-space center of a sector on the galaxy plane. */
export function sectorCenter(key: string): { x: number; z: number } | null {
  const coords = sectorCoords(key);
  if (coords === null) return null;
  return { x: (coords.sx + 0.5) * SECTOR_SIZE, z: (coords.sz + 0.5) * SECTOR_SIZE };
}

/** The sector under (x, z) first, then its 8 neighbours. */
export function neighborSectors(x: number, z: number): string[] {
  const sx = Math.floor(x / SECTOR_SIZE);
  const sz = Math.floor(z / SECTOR_SIZE);
  const keys = [`${String(sx)}:${String(sz)}`];
  for (let dz = -1; dz <= 1; dz += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      if (dx !== 0 || dz !== 0) keys.push(`${String(sx + dx)}:${String(sz + dz)}`);
    }
  }
  return keys;
}

/** Chebyshev distance in sectors between two keys; Infinity if either is malformed. */
export function sectorDistance(a: string, b: string): number {
  const ca = sectorCoords(a);
  const cb = sectorCoords(b);
  if (ca === null || cb === null) return Number.POSITIVE_INFINITY;
  return Math.max(Math.abs(ca.sx - cb.sx), Math.abs(ca.sz - cb.sz));
}

/** Radius of the spiral once `slotCount` slots are taken. */
export const galaxyRadius = (slotCount: number): number => SPACING * Math.sqrt(slotCount + 1);
