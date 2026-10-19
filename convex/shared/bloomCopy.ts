import { clampLevel, MAX_LEVEL } from "./bloom";

// Bloom copy in the 07 voice: name the visible change, never a score (ADR-023). The moon lines
// are 07 `celebrations.new_moon`; the rest follow its pattern.

const NEXT_BLOOM: Record<number, string> = {
  1: "Next bloom: drifting clouds.",
  2: "Next bloom: glints on the water.",
  3: "Next bloom: green across the lowlands.",
  4: "Next bloom: night lights on the dark side.",
  5: "Next bloom: a first moon.",
  6: "Next bloom: fireflies.",
  7: "Next bloom: a polar aurora.",
  8: "Next bloom: a second moon.",
  9: "Next bloom: a radiant halo.",
};

const NEW_MOON = "Your world has a new moon. Take a look.";

const LEVEL_UP: Record<number, string> = {
  2: "Your clouds have started to drift.",
  3: "Light glints on your water now.",
  4: "Green is spreading across your lowlands.",
  5: "Night lights glow on your world's dark side.",
  6: NEW_MOON,
  7: "Fireflies have found your world.",
  8: "An aurora shimmers over your poles.",
  9: NEW_MOON,
  10: "Your world is in full bloom, with a halo all its own.",
};

/** What the next level brings, for the bloom card. */
export function nextBloomLine(level: number): string {
  const current = clampLevel(level);
  return current >= MAX_LEVEL ? "In full bloom." : (NEXT_BLOOM[current] ?? "");
}

/** The owner's message for reaching `level` (the highest level reached since last seen). */
export function levelUpMessage(level: number): string {
  return LEVEL_UP[clampLevel(level)] ?? "";
}
