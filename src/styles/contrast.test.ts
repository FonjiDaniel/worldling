import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

// WCAG 2.2 AA on the brand values the UI actually pairs (SPEC §3.7, docs/brand/README.md).
// Reads the same JSON that generates tokens.css, so a brand change that breaks a pair fails here.
const tokens = JSON.parse(readFileSync("docs/brand/08-handoff/worldling.tokens.json", "utf8")) as {
  color: Record<string, unknown>;
};

type Rgb = [number, number, number];

function color(name: string): Rgb {
  const value = tokens.color[name];
  if (typeof value !== "string") throw new Error(`No color ${name}`);
  return hex(value);
}

function hex(value: string): Rgb {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(value);
  if (!match) throw new Error(`Not a hex color: ${value}`);
  return [
    Number.parseInt(match[1] ?? "", 16),
    Number.parseInt(match[2] ?? "", 16),
    Number.parseInt(match[3] ?? "", 16),
  ];
}

function luminance([r, g, b]: Rgb): number {
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function ratio(a: Rgb, b: Rgb): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** The glass token composited over a backdrop, as the eye sees it. */
function glassOver(backdrop: Rgb): Rgb {
  const glass = /^rgb\((\d+) (\d+) (\d+) \/ (\d+)%\)$/.exec(String(tokens.color.glass));
  if (!glass) throw new Error("Unexpected glass format");
  const alpha = Number(glass[4]) / 100;
  const fill = [Number(glass[1]), Number(glass[2]), Number(glass[3])];
  return backdrop.map((c, i) => Math.round((fill[i] ?? 0) * alpha + c * (1 - alpha))) as Rgb;
}

const TEXT = 4.5;
const NON_TEXT = 3;
const darkSurfaces = ["void", "surface", "surface-raised"];

describe("brand contrast", () => {
  it.each(darkSurfaces.flatMap((bg) => ["text", "text-muted", "link"].map((fg) => [fg, bg])))(
    "%s on %s passes AA text",
    (fg, bg) => {
      expect(ratio(color(fg), color(bg))).toBeGreaterThanOrEqual(TEXT);
    },
  );

  it.each(["success", "warning", "danger", "info"])("%s text on its status surface", (status) => {
    const surface = color(`${status}-surface`);
    expect(ratio(color(status), surface)).toBeGreaterThanOrEqual(TEXT);
    expect(ratio(color("text"), surface)).toBeGreaterThanOrEqual(TEXT);
  });

  it.each([
    ["on-primary", "primary"],
    ["on-accent", "accent"],
    ["on-warm", "warm"],
    ["void", "danger"],
  ])("%s label on %s fill", (fg, bg) => {
    expect(ratio(color(fg), color(bg))).toBeGreaterThanOrEqual(TEXT);
  });

  it("keeps Void labels readable on the warm hover and pressed fills", () => {
    const sunrise = tokens.color.sunrise as Record<string, string>;
    for (const step of ["400", "600"]) {
      expect(ratio(color("void"), hex(sunrise[step] ?? ""))).toBeGreaterThanOrEqual(TEXT);
    }
  });

  // Worst backdrops a 3D scene can put behind glass: white, snow, Starlight, Sunrise, Aurora.
  const backdrops: Rgb[] = [
    [255, 255, 255],
    hex("#e8edef"),
    color("text"),
    color("warm"),
    color("accent"),
  ];

  it.each(backdrops.map((b) => [b.join(","), b] as const))(
    "text on glass over %s passes AA",
    (_name, backdrop) => {
      const glass = glassOver(backdrop);
      for (const fg of ["text", "text-muted", "link"]) {
        expect(ratio(color(fg), glass)).toBeGreaterThanOrEqual(TEXT);
      }
      expect(ratio(color("glass-control-line"), glass)).toBeGreaterThanOrEqual(NON_TEXT);
    },
  );

  it.each(darkSurfaces)("control line and focus ring stand out on %s", (bg) => {
    expect(ratio(color("control-line"), color(bg))).toBeGreaterThanOrEqual(NON_TEXT);
    expect(ratio(color("accent"), color(bg))).toBeGreaterThanOrEqual(NON_TEXT);
  });
});
