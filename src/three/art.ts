// 3D art colors come from the --art-* tokens in src/styles/tokens.css (CLAUDE.md brand rules).
// Read once on the client and passed into the pure uniform builder.

export interface ArtColors {
  space: string;
  keyLight: string;
  fillLight: string;
  nightLights: string;
  firefly: string;
  comet: string;
  aurora: string;
  halo: string;
  moon: string;
  nebula: string;
  star: string;
}

const TOKENS: Record<keyof ArtColors, string> = {
  space: "--art-space",
  keyLight: "--art-key-light",
  fillLight: "--art-fill-light",
  nightLights: "--art-night-lights",
  firefly: "--art-firefly",
  comet: "--art-comet",
  aurora: "--art-aurora",
  halo: "--art-halo",
  moon: "--art-moon",
  nebula: "--art-nebula",
  star: "--art-star",
};

const HEX = /^#[0-9a-f]{6}$/;

let cached: ArtColors | null = null;

/** Resolves every art token to "#rrggbb". Throws if a token is missing, so a typo fails loudly. */
export function readArtColors(): ArtColors {
  if (cached) return cached;
  const probe = document.createElement("span");
  document.body.append(probe);
  try {
    const entries = Object.entries(TOKENS).map(([key, token]) => {
      probe.style.color = `var(${token})`;
      const value = toHex(getComputedStyle(probe).color);
      if (!HEX.test(value)) throw new Error(`Art token ${token} did not resolve`);
      return [key, value] as const;
    });
    cached = Object.fromEntries(entries) as unknown as ArtColors;
    return cached;
  } finally {
    probe.remove();
  }
}

/** A computed color string (three channels) to "#rrggbb". */
export function toHex(computed: string): string {
  const channels =
    computed
      .match(/\d+(\.\d+)?/g)
      ?.slice(0, 3)
      .map(Number) ?? [];
  if (channels.length !== 3) return "";
  return `#${channels.map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")}`;
}
