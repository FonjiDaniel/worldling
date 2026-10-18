import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

// SPEC §3.1: no raw hex, px or ms values outside src/styles/tokens.css.
const roots = ["src/components", "src/features", "src/app", "src/three"];
const patterns: { name: string; regex: RegExp }[] = [
  { name: "hex color", regex: /#[0-9a-fA-F]{3,8}\b/ },
  { name: "color function", regex: /\b(?:rgba?|hsla?|oklch|oklab|lab|lch)\(/ },
  { name: "px value", regex: /\b\d+(?:\.\d+)?px\b/ },
  { name: "ms value", regex: /\b\d+(?:\.\d+)?ms\b/ },
];

function listSourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return listSourceFiles(path);
    return /\.(?:ts|tsx|css)$/.test(entry) && !entry.includes(".test.") ? [path] : [];
  });
}

function findViolations(): string[] {
  const violations: string[] = [];
  for (const file of roots.flatMap(listSourceFiles)) {
    const lines = readFileSync(file, "utf8").split("\n");
    lines.forEach((line, index) => {
      for (const { name, regex } of patterns) {
        if (regex.test(line)) {
          violations.push(`${relative(process.cwd(), file)}:${index + 1} ${name}: ${line.trim()}`);
        }
      }
    });
  }
  return violations;
}

describe("design token discipline", () => {
  it("has no raw colors, px or ms values in components, features, app or three", () => {
    expect(findViolations()).toEqual([]);
  });
});
