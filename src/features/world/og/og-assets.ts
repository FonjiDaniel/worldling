import { readFile } from "node:fs/promises";
import { join } from "node:path";

import sharp from "sharp";

import { THUMBNAIL_MAX_BYTES, THUMBNAIL_TYPE } from "@convex/shared/worldParams";

import { env } from "@/lib/env";

import type { OgPlanet } from "./og-card";
import type { PublicWorld } from "../server";

// Files and data for the OG image. Fonts are static instances (src/assets/fonts/README.md).

const THUMBNAIL_TIMEOUT = 3_000;

// Static paths, so output tracing includes only these files.
const font = (file: string) => readFile(join(process.cwd(), "src/assets/fonts", file));
const brand = (file: string) => readFile(join(process.cwd(), "public/brand", file));

export async function ogFonts() {
  const [display, regular, semibold] = await Promise.all([
    font("BricolageGrotesque-650.ttf"),
    font("Geist-400.ttf"),
    font("Geist-600.ttf"),
  ]);
  return [
    { name: "Bricolage Grotesque", data: display, weight: 600, style: "normal" },
    { name: "Geist", data: regular, weight: 400, style: "normal" },
    { name: "Geist", data: semibold, weight: 600, style: "normal" },
  ] as const;
}

const svgUri = (file: Buffer) => `data:image/svg+xml;base64,${file.toString("base64")}`;

export async function ogBrand() {
  const [logo, mark] = await Promise.all([
    brand("worldling-horizontal-white-transparent.svg"),
    brand("worldling-mark-hero-gradient.svg"),
  ]);
  return { logo: svgUri(logo), mark: svgUri(mark) };
}

/**
 * The stored thumbnail as a PNG data URI. Only our Convex storage, only WebP within the limit.
 * Satori accepts WebP but its renderer draws nothing for it, so it is converted first.
 */
async function thumbnail(url: string): Promise<string | null> {
  if (new URL(url).origin !== new URL(env.NEXT_PUBLIC_CONVEX_URL).origin) return null;
  const response = await fetch(url, { signal: AbortSignal.timeout(THUMBNAIL_TIMEOUT) });
  if (!response.ok || response.headers.get("content-type") !== THUMBNAIL_TYPE) return null;
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.byteLength > THUMBNAIL_MAX_BYTES) return null;
  const png = await sharp(bytes).png().toBuffer();
  return `data:image/png;base64,${png.toString("base64")}`;
}

/** The thumbnail when it loads, otherwise a disc in the world's own colors. */
export async function ogPlanet({ world }: PublicWorld): Promise<OgPlanet> {
  const src =
    world.thumbnailUrl === null ? null : await thumbnail(world.thumbnailUrl).catch(() => null);
  if (src !== null) return { kind: "image", src };
  const { ocean, palette, atmosphere } = world.params;
  return { kind: "disc", ocean: ocean.color, stops: palette.stops, atmosphere: atmosphere.color };
}
