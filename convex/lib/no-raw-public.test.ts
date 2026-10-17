import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

// SPEC §5.1 rule 1: public functions only through lib/functions.ts wrappers.
const CONVEX_DIR = fileURLToPath(new URL("..", import.meta.url));
const ALLOWED = new Set(["lib/functions.ts"]);
const RAW_PUBLIC = /import\s*\{([^}]*)\}\s*from\s*["'][./]*_generated\/server["']/g;
const PUBLIC_BUILDERS = new Set(["query", "mutation", "action", "httpAction"]);

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === "_generated" ? [] : sourceFiles(path);
    return /\.tsx?$/.test(entry.name) && !entry.name.includes(".test") ? [path] : [];
  });
}

function rawBuilders(source: string): string[] {
  return [...source.matchAll(RAW_PUBLIC)].flatMap((match) =>
    (match[1] ?? "")
      .split(",")
      .map(
        (name) =>
          name
            .replace(/^\s*type\s+/, "")
            .split(/\s+as\s+/)[0]
            ?.trim() ?? "",
      )
      .filter((name) => PUBLIC_BUILDERS.has(name)),
  );
}

describe("public function wrappers", () => {
  it("are the only users of raw query/mutation/action", () => {
    const offenders = sourceFiles(CONVEX_DIR)
      .map((path) => ({ file: relative(CONVEX_DIR, path).replaceAll("\\", "/"), path }))
      .filter(({ file }) => !ALLOWED.has(file))
      .flatMap(({ file, path }) =>
        rawBuilders(readFileSync(path, "utf8")).map((name) => `${file}: ${name}`),
      );
    expect(offenders).toEqual([]);
  });

  it("detects a raw import", () => {
    expect(rawBuilders('import { query, internalMutation } from "./_generated/server";')).toEqual([
      "query",
    ]);
    expect(rawBuilders('import { internalQuery } from "../_generated/server";')).toEqual([]);
  });
});
