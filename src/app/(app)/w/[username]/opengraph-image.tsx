import { ImageResponse } from "next/og";

import { ogBrand, ogFonts, ogPlanet } from "@/features/world/og/og-assets";
import { OG_SIZE, OgCard, type OgWorld } from "@/features/world/og/og-card";
import { loadPublicWorld } from "@/features/world/server";
import { reportError } from "@/lib/logger";

// The world's share image (SPEC §12), matching the 06 OG template.

export const alt = "A world to visit on Worldling";
export const size = OG_SIZE;
export const contentType = "image/png";

async function worldFor(username: string): Promise<OgWorld | null> {
  try {
    const data = await loadPublicWorld(username);
    if (data === null) return null;
    return { name: data.world.name, username: data.owner.username, planet: await ogPlanet(data) };
  } catch (error) {
    reportError(error, { fn: "og.world" });
    return null;
  }
}

export default async function Image({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const [world, brand, fonts] = await Promise.all([
    worldFor(decodeURIComponent(username)),
    ogBrand(),
    ogFonts(),
  ]);
  return new ImageResponse(<OgCard world={world} logo={brand.logo} mark={brand.mark} />, {
    ...OG_SIZE,
    fonts: [...fonts],
  });
}
