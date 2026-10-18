// Pure color helpers shared by params validation, describeWorld and the renderer.

export type Rgb = readonly [number, number, number];
export interface Hsl {
  h: number; // degrees, 0..360
  s: number; // 0..1
  l: number; // 0..1
}

/**
 * Safe ranges for any world color (ADR-009). Chroma (max minus min channel) caps neon, which
 * HSL saturation can't: pale creams read as 100% saturated. Curated palettes sit inside.
 */
export const COLOR_LIMITS = { maxChroma: 0.8, minLightness: 0.06, maxLightness: 0.98 };

/** "#rrggbb" to 0..1 sRGB channels. */
export function hexToRgb(hex: string): Rgb {
  const n = Number.parseInt(hex.slice(1, 7), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export function rgbToHex([r, g, b]: Rgb): string {
  const byte = (c: number) =>
    Math.round(Math.min(1, Math.max(0, c)) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${byte(r)}${byte(g)}${byte(b)}`;
}

export function rgbToHsl([r, g, b]: Rgb): Hsl {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return { h: (h * 60 + 360) % 360, s, l };
}

export function hslToRgb({ h, s, l }: Hsl): Rgb {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const sector = Math.floor((((h % 360) + 360) % 360) / 60);
  const table: readonly Rgb[] = [
    [c, x, 0],
    [x, c, 0],
    [0, c, x],
    [0, x, c],
    [x, 0, c],
    [c, 0, x],
  ];
  const [r, g, b] = table[sector] ?? [c, x, 0];
  return [r + m, g + m, b + m];
}

/** Clamps chroma and lightness into the safe ranges. In-range colors come back unchanged. */
export function clampColor(hex: string): string {
  const rgb = hexToRgb(hex);
  const { maxChroma, minLightness, maxLightness } = COLOR_LIMITS;
  const max = Math.max(...rgb);
  const min = Math.min(...rgb);
  const chroma = max - min;
  const lightness = (max + min) / 2;
  if (chroma <= maxChroma && lightness >= minLightness && lightness <= maxLightness) return hex;
  const k = chroma > maxChroma ? maxChroma / chroma : 1;
  const target = Math.min(maxLightness, Math.max(minLightness, lightness));
  const shifted = rgb.map((c) => target + (c - lightness) * k);
  const [r = 0, g = 0, b = 0] = shifted;
  return rgbToHex([r, g, b]);
}

/** sRGB channel to linear light, for shader uniforms. */
export function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function hexToLinear(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex);
  return [srgbToLinear(r), srgbToLinear(g), srgbToLinear(b)];
}
