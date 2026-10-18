import type { Biome } from "@convex/shared/worldParams";

// One planet from the 3x2 moodboard (05 art direction), cropped with background-position.
// Reference only: served by a dev route, never shipped.

const COLUMNS = 3;
const ROWS = 2;

export function MoodboardTile({ index, biome }: { index: number; biome: Biome }) {
  const column = index % COLUMNS;
  const row = Math.floor(index / COLUMNS);
  const style = {
    backgroundImage: "url(/dev/planet/moodboard)",
    backgroundSize: `${COLUMNS * 100}% ${ROWS * 100}%`,
    backgroundPosition: `${(column / (COLUMNS - 1)) * 100}% ${(row / (ROWS - 1)) * 100}%`,
  };
  return (
    <div
      role="img"
      aria-label={`Moodboard reference for the ${biome} world`}
      className="aspect-square rounded-md border border-line bg-void"
      style={style}
    />
  );
}
