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
