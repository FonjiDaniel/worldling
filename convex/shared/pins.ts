import { hexToRgb, hslToRgb, rgbToHex, rgbToHsl } from "./color";
import type { WorldParams } from "./worldParams";

// Universe pins (SPEC §5.5, ADR-024): the few fields the galaxy needs to draw a world from afar.

/** Pins one sector can hold. A sector holds about 130 worlds at SPACING 6. */
export const PIN_SECTOR_CAP = 256;

/** Pins `universe.search` returns. */
export const SEARCH_LIMIT = 6;

/** World ids `universe.renderable` accepts, the highest near LOD count (§8.2). */
export const RENDERABLE_LIMIT = 12;

/** Worlds in the featured and just born lists. */
export const RAIL_SIZE = 12;

const MIN_LIGHTNESS = 0.45;
const MAX_LIGHTNESS = 0.82;

/** Lifts dark colors so a tiny dot still reads on Void, and calms very pale ones. */
function readable(hex: string): string {
  const hsl = rgbToHsl(hexToRgb(hex));
  const l = Math.min(MAX_LIGHTNESS, Math.max(MIN_LIGHTNESS, hsl.l));
  return l === hsl.l ? hex : rgbToHex(hslToRgb({ ...hsl, l }));
}

/** Core and halo colors for a far-away world: its middle land stop and its atmosphere. */
export function pinColors(params: WorldParams): { colorA: string; colorB: string } {
  const land = params.palette.stops[2] ?? params.ocean.color;
  return { colorA: readable(land), colorB: readable(params.atmosphere.color) };
}
