import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

// Runs an internal Convex function on the deployment the CLI is logged in to (ADR-016).

const exec = promisify(execFile);
const CONVEX_CLI = fileURLToPath(
  new URL("../../../node_modules/convex/bin/main.js", import.meta.url),
);

export async function convexRun(fn: string, args: object): Promise<unknown> {
  // The CLI's JS entry through node, so no shell has to quote the JSON (cmd.exe can't).
  const { stdout } = await exec(process.execPath, [CONVEX_CLI, "run", fn, JSON.stringify(args)]);
  const text = stdout.trim();
  return text === "" ? null : (JSON.parse(text) as unknown);
}
