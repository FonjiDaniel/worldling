import { unlocksFor } from "./bloom";
import { hexToRgb, rgbToHsl } from "./color";
import type { WorldParams } from "./worldParams";

// Plain-language world descriptions for the canvas aria-label and list mode (SPEC §3.7).

const HUES: readonly (readonly [number, string])[] = [
  [15, "red"],
  [40, "coral"],
  [55, "amber"],
  [75, "golden"],
  [150, "green"],
  [185, "teal"],
  [200, "turquoise"],
  [245, "blue"],
  [290, "violet"],
  [335, "pink"],
  [360, "red"],
];

/** A short color phrase, like "pale blue" or "deep teal". */
export function colorName(hex: string): string {
  const { h, s, l } = rgbToHsl(hexToRgb(hex));
  if (s < 0.15) return l > 0.75 ? "pale grey" : l < 0.3 ? "dark grey" : "grey";
  const hue = HUES.find(([limit]) => h < limit)?.[1] ?? "red";
  if (l > 0.68) return `pale ${hue}`;
  if (l < 0.3) return `deep ${hue}`;
  return hue;
}

function waterPhrase(params: WorldParams): string {
  const { seaLevel } = params.terrain;
  const color = colorName(params.ocean.color);
  if (params.biome === "volcanic") return `${color} lava ${seaLevel >= 0.35 ? "seas" : "seams"}`;
  if (seaLevel >= 0.5) return `${color} oceans`;
  if (seaLevel >= 0.25) return `${color} seas`;
  return `${color} lakes`;
}

function cloudPhrase(coverage: number): string {
  if (coverage < 0.08) return "clear skies";
  if (coverage < 0.3) return "wisps of cloud";
  if (coverage < 0.6) return "soft clouds";
  return "thick clouds";
}

function list(parts: readonly string[]): string {
  if (parts.length <= 1) return parts.join("");
  return `${parts.slice(0, -1).join(", ")} and ${parts.at(-1) ?? ""}`;
}

/** For example "A frozen world with pale blue seas, soft clouds and two moons." */
export function describeWorld(params: WorldParams, level = 1): string {
  const unlocks = unlocksFor(level);
  const parts = [waterPhrase(params), cloudPhrase(params.clouds.coverage)];
  if (unlocks.nightLights) parts.push("night lights");
  if (unlocks.moons === 1) parts.push("one moon");
  if (unlocks.moons === 2) parts.push("two moons");
  const article = /^[aeiou]/.test(params.biome) ? "An" : "A";
  return `${article} ${params.biome} world with ${list(parts)}.`;
}
