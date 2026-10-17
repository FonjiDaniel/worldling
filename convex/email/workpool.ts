import { Workpool } from "@convex-dev/workpool";

import { components } from "../_generated/api";
import { SECOND_MS } from "../lib/time";

// SPEC §7.2: max 5 attempts, starting at 10s, doubling. The workpool adds 0.5x to 1.5x jitter.
export const emailWorkpool = new Workpool(components.emailWorkpool, {
  maxParallelism: 10,
  retryActionsByDefault: true,
  defaultRetryBehavior: { maxAttempts: 5, initialBackoffMs: 10 * SECOND_MS, base: 2 },
});
