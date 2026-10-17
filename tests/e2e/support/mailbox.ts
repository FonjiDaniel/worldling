import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

// Reads the e2e mailbox on the Convex deployment the CLI is logged in to (ADR-016).

const run = promisify(execFile);
const CONVEX_CLI = fileURLToPath(
  new URL("../../../node_modules/convex/bin/main.js", import.meta.url),
);
const POLL_MS = 1000;
const TIMEOUT_MS = 45_000;

export const E2E_DOMAIN = "e2e.worldling.test";

export function e2eEmail(): string {
  return `e2e+${crypto.randomUUID().slice(0, 12)}@${E2E_DOMAIN}`;
}

interface Mail {
  template: string;
  data: Record<string, unknown>;
}

async function takeLatest(to: string, template: string): Promise<Mail | null> {
  const args = JSON.stringify({ to, template });
  // The CLI's JS entry through node, so no shell has to quote the JSON (cmd.exe can't).
  const { stdout } = await run(process.execPath, [
    CONVEX_CLI,
    "run",
    "testing/e2e:takeLatestEmail",
    args,
  ]);
  const text = stdout.trim();
  return text === "" || text === "null" ? null : (JSON.parse(text) as Mail);
}

/** Waits for the code in the newest `template` email to `to`. */
export async function waitForCode(
  to: string,
  template: "auth.verify" | "auth.reset",
): Promise<string> {
  const deadline = Date.now() + TIMEOUT_MS;
  while (Date.now() < deadline) {
    const mail = await takeLatest(to, template);
    const code = mail?.data.code;
    if (typeof code === "string") return code;
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
  }
  throw new Error(`No ${template} email reached ${to} within ${String(TIMEOUT_MS / 1000)}s`);
}
