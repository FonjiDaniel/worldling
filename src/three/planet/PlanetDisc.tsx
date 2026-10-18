import type { WorldParams } from "@convex/shared/worldParams";

/**
 * Tier 0 world (SPEC §8.9): a softly lit disc in the world's own colors. Colors are world data,
 * not design tokens, so they arrive through CSS variables set from params.
 */
export function PlanetDisc({ params }: { params: WorldParams }) {
  const [shore, low, mid, high] = params.palette.stops;
  const style = {
    "--disc-ocean": params.ocean.color,
    "--disc-shore": shore,
    "--disc-low": low,
    "--disc-mid": mid,
    "--disc-high": high,
    "--disc-atmosphere": params.atmosphere.color,
  } as React.CSSProperties;
  return (
    <div className="flex size-full items-center justify-center" style={style}>
      <div className="aspect-square w-3/4 rounded-full planet-disc" />
    </div>
  );
}
