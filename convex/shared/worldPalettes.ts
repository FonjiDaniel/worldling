import type { Biome } from "./worldParams";

// Curated world palettes (SPEC §3.8, ADR-009). The first palette of each biome expands the
// brand triad from docs/brand/05-visual-language; the others are derived from the six-world
// moodboard. Pending brand: the kit has no full palette file yet.
// Stops run from shoreline to peaks. These are art colors, not UI tokens.

export type Stops = readonly [string, string, string, string, string];

export interface CuratedPalette {
  id: string;
  biome: Biome;
  stops: Stops;
  ocean: string;
  atmosphere: string;
  clouds: string;
}

// prettier-ignore
export const PALETTES: readonly CuratedPalette[] = [
  // Oceanic: petrol sea, turquoise shallows, sandy islands with a little green.
  { id: "oceanic-lagoon", biome: "oceanic", stops: ["#e4d8b3", "#8fb85a", "#4f8a3e", "#6f7a5c", "#8c8778"], ocean: "#245d82", atmosphere: "#9ccfe8", clouds: "#f4f1ea" },
  { id: "oceanic-reef", biome: "oceanic", stops: ["#efdcae", "#b5c46a", "#6a9a48", "#5f8a4a", "#8a7f6a"], ocean: "#1e6f8c", atmosphere: "#a6e0e6", clouds: "#f6f3ea" },
  { id: "oceanic-deep", biome: "oceanic", stops: ["#d9cfa8", "#7fa85a", "#3f6e45", "#5f6670", "#dcdfe0"], ocean: "#1b4a73", atmosphere: "#8fb8e6", clouds: "#eef1f2" },
  { id: "oceanic-coral", biome: "oceanic", stops: ["#f2d6b8", "#d9a37e", "#8fae6a", "#6e8a5a", "#f3ece0"], ocean: "#2a6c8f", atmosphere: "#b5d8ef", clouds: "#fbf3ea" },
  // Verdant: moss and jade hills, a blue river, muted stone.
  { id: "verdant-meadow", biome: "verdant", stops: ["#b4c96e", "#93bf52", "#62a043", "#3f7a38", "#7a7f6c"], ocean: "#4da5ac", atmosphere: "#b5e3cf", clouds: "#f6f3ec" },
  { id: "verdant-jade", biome: "verdant", stops: ["#c4c98a", "#86b062", "#5a9a58", "#4f8a55", "#6f7d70"], ocean: "#3f97a6", atmosphere: "#a9e2d4", clouds: "#f3f4ec" },
  { id: "verdant-spring", biome: "verdant", stops: ["#d6d394", "#b4c76b", "#8ab456", "#6f9a4a", "#8f917c"], ocean: "#57b0b4", atmosphere: "#c6eac9", clouds: "#fbf8ee" },
  { id: "verdant-forest", biome: "verdant", stops: ["#a9b072", "#7c9a52", "#56804a", "#46683f", "#62685f"], ocean: "#3a8794", atmosphere: "#a0d6c4", clouds: "#eef0e8" },
  // Desert: ochre dunes, peach sand, terracotta mesas, one teal oasis.
  { id: "desert-dunes", biome: "desert", stops: ["#f0c890", "#e9b682", "#d49563", "#bd7954", "#9c5a3e"], ocean: "#78bdb2", atmosphere: "#f5cfa4", clouds: "#fff4e3" },
  { id: "desert-sunset", biome: "desert", stops: ["#f2c79a", "#e3a271", "#c97d55", "#a8604a", "#874a3f"], ocean: "#6fb3ad", atmosphere: "#f7c2a0", clouds: "#fff0e2" },
  { id: "desert-sandstone", biome: "desert", stops: ["#ecd3a3", "#dcb27a", "#c48e5e", "#a87654", "#e8d2b4"], ocean: "#7cc3b4", atmosphere: "#f1d4ad", clouds: "#fff6e8" },
  { id: "desert-ochre", biome: "desert", stops: ["#e8be7a", "#d9a05c", "#c0804a", "#9b623e", "#74493a"], ocean: "#69ada6", atmosphere: "#efc58f", clouds: "#fdf0dc" },
  // Frozen: powder snow, pale cyan lakes, softened grey ridges.
  { id: "frozen-glacier", biome: "frozen", stops: ["#bedfe4", "#e8edef", "#dde8ee", "#b2c4cf", "#f7f9fa"], ocean: "#729caf", atmosphere: "#cfe6f2", clouds: "#f8fafb" },
  { id: "frozen-tundra", biome: "frozen", stops: ["#c9d6cf", "#a9bcb8", "#e2e9ea", "#7f8e98", "#f3f6f7"], ocean: "#5e8ea5", atmosphere: "#c4dcec", clouds: "#f4f7f8" },
  { id: "frozen-aurora", biome: "frozen", stops: ["#c4e3e6", "#e6eef2", "#c9d8ec", "#8a94b5", "#f2f4f9"], ocean: "#6a8fb8", atmosphere: "#c9d6f5", clouds: "#f5f6fb" },
  { id: "frozen-pale", biome: "frozen", stops: ["#d6e6ea", "#eef2f3", "#dce7ee", "#a3b4bf", "#f6f8f9"], ocean: "#86b3c4", atmosphere: "#d8ebf3", clouds: "#f6f8f9" },
  // Volcanic: warm charcoal basalt, restrained coral lava, smoky clouds.
  { id: "volcanic-ember", biome: "volcanic", stops: ["#6b4f4b", "#4b4957", "#403e4b", "#57525f", "#8a6a63"], ocean: "#f28d60", atmosphere: "#e8a08a", clouds: "#b8aeb0" },
  { id: "volcanic-dusk", biome: "volcanic", stops: ["#7a5650", "#554b5a", "#45404f", "#605867", "#a16658"], ocean: "#e97a55", atmosphere: "#d99a92", clouds: "#b3a8ad" },
  { id: "volcanic-ash", biome: "volcanic", stops: ["#6f6a6e", "#5a5760", "#48464f", "#6b6870", "#9a9497"], ocean: "#f0a060", atmosphere: "#c9b0a6", clouds: "#c4bec0" },
  { id: "volcanic-obsidian", biome: "volcanic", stops: ["#4f3f48", "#3a3744", "#2f2d3a", "#4a4655", "#7d5f66"], ocean: "#ec8a5e", atmosphere: "#c48a9a", clouds: "#a39aa3" },
  // Crystal: lavender stone, amethyst and mint clusters, a quiet teal pool.
  { id: "crystal-amethyst", biome: "crystal", stops: ["#cfc4e0", "#ada0c7", "#8c7aaf", "#6f5f96", "#8bcbbb"], ocean: "#5fb8b0", atmosphere: "#c9b8ec", clouds: "#f1edf8" },
  { id: "crystal-opal", biome: "crystal", stops: ["#d6cbe0", "#c0b3d4", "#9d8cbf", "#b8c9d8", "#9ad6c6"], ocean: "#6cc3b8", atmosphere: "#d2c4f0", clouds: "#f5f1fa" },
  { id: "crystal-mint", biome: "crystal", stops: ["#c9d6d2", "#b3c3c6", "#8fa6b8", "#9a8cba", "#8bcbbb"], ocean: "#4fae9f", atmosphere: "#b8e2d8", clouds: "#eef6f3" },
  { id: "crystal-dusk", biome: "crystal", stops: ["#b8a6c9", "#9c88b8", "#7a679f", "#8f80b0", "#c4b8d8"], ocean: "#5a9fb0", atmosphere: "#bba9e6", clouds: "#ece7f6" },
];

export function palettesFor(biome: Biome): readonly CuratedPalette[] {
  return PALETTES.filter((palette) => palette.biome === biome);
}

export function findPalette(id: string): CuratedPalette | undefined {
  return PALETTES.find((palette) => palette.id === id);
}
