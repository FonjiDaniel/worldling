import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { connection } from "next/server";

import { devRoutesEnabled } from "@/lib/dev-routes";

// The six-world moodboard for side-by-side tuning. Served from docs/brand in dev only, so the
// reference image never ships as a product asset (CLAUDE.md brand rules).
const MOODBOARD =
  "docs/brand/05-visual-language/02-art-direction/Worldling-Six-Worlds-Moodboard.png";

export async function GET(): Promise<Response> {
  // Read at request time so no build ever bakes the reference image into its output.
  await connection();
  if (!devRoutesEnabled()) return new Response(null, { status: 404 });
  try {
    const image = await readFile(join(process.cwd(), MOODBOARD));
    return new Response(new Uint8Array(image), {
      headers: { "content-type": "image/png", "cache-control": "no-store" },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
