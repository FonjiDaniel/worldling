import { countGraphemes } from "@convex/shared/graphemes";
import { checkText, MODERATION_COPY } from "@convex/shared/moderation";
import { type Biome, WORLD_NAME_MAX, worldNameSchema } from "@convex/shared/worldParams";

// Display names and name checks for the creator. The 07 French labels belong to the French copy
// file, so only English lives here.

const BIOME_NAMES: Record<Biome, string> = {
  oceanic: "Oceanic",
  verdant: "Verdant",
  desert: "Desert",
  frozen: "Frozen",
  volcanic: "Volcanic",
  crystal: "Crystal",
};

export function biomeName(biome: Biome): string {
  return BIOME_NAMES[biome];
}

/** "verdant-meadow" reads as "Meadow"; custom colors as "Custom". */
export function paletteName(id: string): string {
  const word = id.split("-").at(-1) ?? id;
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/** The problem with a world name in plain words, or null when it can be saved. */
export function worldNameProblem(name: string): string | null {
  const parsed = worldNameSchema.safeParse(name);
  if (!parsed.success) {
    return countGraphemes(name.trim()) === 0
      ? "Give your world a name."
      : `Keep it to ${String(WORLD_NAME_MAX)} characters or fewer.`;
  }
  const moderation = checkText(parsed.data);
  return moderation.ok ? null : MODERATION_COPY[moderation.kind];
}
