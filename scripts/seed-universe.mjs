// Seeds the dev deployment with worlds for universe performance tests (Phase 8).
// Usage: pnpm seed:universe [count]   |   pnpm seed:universe --clear
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// Runs the Convex CLI through node directly, so the JSON argument survives Windows shells.
const cli = fileURLToPath(new URL("../node_modules/convex/bin/main.js", import.meta.url));

const arg = process.argv[2];
const run = (fn, args) =>
  execFileSync(process.execPath, [cli, "run", fn, JSON.stringify(args)], { stdio: "inherit" });

if (arg === "--clear") {
  run("testing/universe:clearSeeded", {});
  console.log("Clearing seeded worlds in the background.");
} else {
  const count = Number.parseInt(arg ?? "10000", 10);
  if (!Number.isInteger(count) || count < 1 || count > 50000) {
    console.error("Count must be a whole number from 1 to 50000.");
    process.exit(1);
  }
  run("testing/universe:seedUniverse", { count });
  console.log(`Seeding ${String(count)} worlds in batches of 200 in the background.`);
}
