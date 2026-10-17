import { type RateLimitConfig, RateLimiter } from "@convex-dev/rate-limiter";

import { components } from "../_generated/api";
import type { ActionCtx, MutationCtx } from "../_generated/server";
import { appError } from "./errors";
import { DAY_MS, HOUR_MS, MINUTE_MS } from "./time";

// Every rate limit, defined once (SPEC §11.4). Two-rule limits are split into two keys:
// `comet.send` + `comet.sendDaily`, and `email.perRecipient` + `email.perRecipientSecurity`.
const RATE_LIMITS = {
  "comet.send": { kind: "token bucket", rate: 5, period: MINUTE_MS, capacity: 5 },
  "comet.sendDaily": { kind: "fixed window", rate: 30, period: DAY_MS },
  "comet.sendToWorld": { kind: "fixed window", rate: 3, period: DAY_MS },
  "world.update": { kind: "token bucket", rate: 20, period: MINUTE_MS, capacity: 20 },
  "world.create": { kind: "fixed window", rate: 3, period: DAY_MS },
  "visit.record": { kind: "token bucket", rate: 60, period: MINUTE_MS, capacity: 60 },
  "report.create": { kind: "fixed window", rate: 10, period: DAY_MS },
  "profile.update": { kind: "fixed window", rate: 10, period: HOUR_MS },
  "email.perRecipient": { kind: "fixed window", rate: 5, period: HOUR_MS },
  "email.perRecipientSecurity": { kind: "fixed window", rate: 10, period: HOUR_MS },
  "admin.emailTest": { kind: "fixed window", rate: 5, period: 10 * MINUTE_MS },
  "account.export": { kind: "fixed window", rate: 2, period: DAY_MS },
} satisfies Record<string, RateLimitConfig>;

export type RateLimitName = keyof typeof RATE_LIMITS;

export const rateLimiter = new RateLimiter(components.rateLimiter, RATE_LIMITS);

/**
 * Consumes one token for `key` (e.g. a user id, or `${userId}:${worldId}`).
 * Throws RATE_LIMITED with `retryAfterMs` when the limit is reached.
 */
export async function enforceRateLimit(
  ctx: MutationCtx | ActionCtx,
  name: RateLimitName,
  key: string,
): Promise<void> {
  const status = await rateLimiter.limit(ctx, name, { key });
  if (!status.ok) {
    throw appError("RATE_LIMITED", `Rate limit reached: ${name}`, {
      retryAfterMs: Math.ceil(status.retryAfter),
    });
  }
}
