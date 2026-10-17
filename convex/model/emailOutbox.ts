import { z } from "zod";

import { internal } from "../_generated/api";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { emailWorkpool } from "../email/workpool";
import { appError } from "../lib/errors";
import type { Logger } from "../lib/logger";
import { enforceRateLimit, rateLimiter } from "../lib/rateLimits";
import {
  type EmailTemplateKey,
  isSuppressedBy,
  parseTemplateData,
  templateCategory,
} from "../shared/emailTemplates";

// enqueueEmail (SPEC §7.2). Runs inside the caller's mutation, so the outbox row and the
// domain change commit together. Sending happens later in email/dispatch.send.

export type EnqueueCtx = MutationCtx & { rid: string; log: Logger };

export interface EnqueueInput {
  to: string;
  template: EmailTemplateKey;
  data: unknown;
  /** Same key, same email: a repeat call returns the existing row and sends nothing. */
  idempotencyKey: string;
}

export interface EnqueueResult {
  outboxId: Id<"emailOutbox">;
  status: Doc<"emailOutbox">["status"];
  deduped: boolean;
}

const recipient = z.email().max(254);

export async function enqueueEmail(ctx: EnqueueCtx, input: EnqueueInput): Promise<EnqueueResult> {
  const { template, idempotencyKey } = input;
  const existing = await ctx.db
    .query("emailOutbox")
    .withIndex("by_idempotency", (q) => q.eq("idempotencyKey", idempotencyKey))
    .unique();
  if (existing !== null) {
    ctx.log.info("email.enqueue.deduped", { outboxId: existing._id, template });
    return { outboxId: existing._id, status: existing.status, deduped: true };
  }

  const to = input.to.trim().toLowerCase();
  if (!recipient.safeParse(to).success) {
    throw appError("VALIDATION", "Invalid recipient", { fieldErrors: { to: ["Invalid email"] } });
  }
  const parsed = parseTemplateData(template, input.data);
  if (!parsed.ok) {
    throw appError("VALIDATION", `Invalid data for ${template}`, {
      fieldErrors: parsed.fieldErrors,
    });
  }
  const category = templateCategory(template);
  const row = { to, template, data: parsed.data, category, idempotencyKey, rid: ctx.rid };

  if (category !== "security" && (await isSuppressed(ctx, to, template))) {
    const outboxId = await ctx.db.insert("emailOutbox", {
      ...row,
      status: "suppressed",
      attempts: 0,
    });
    ctx.log.info("email.enqueue.suppressed", { outboxId, template });
    return { outboxId, status: "suppressed", deduped: false };
  }

  if (category === "security") {
    await enforceRateLimit(ctx, "email.perRecipientSecurity", to);
  } else if (!(await rateLimiter.limit(ctx, "email.perRecipient", { key: to })).ok) {
    const outboxId = await ctx.db.insert("emailOutbox", {
      ...row,
      status: "cancelled",
      attempts: 0,
      lastError: "rate_limited",
    });
    ctx.log.warn("email.enqueue.rate_limited", { outboxId, template });
    return { outboxId, status: "cancelled", deduped: false };
  }

  const outboxId = await ctx.db.insert("emailOutbox", { ...row, status: "queued", attempts: 0 });
  await emailWorkpool.enqueueAction(
    ctx,
    internal.email.dispatch.send,
    { outboxId },
    { onComplete: internal.email.outbox.onComplete, context: { outboxId } },
  );
  ctx.log.info("email.enqueue.queued", { outboxId, template });
  return { outboxId, status: "queued", deduped: false };
}

async function isSuppressed(
  ctx: EnqueueCtx,
  email: string,
  template: EmailTemplateKey,
): Promise<boolean> {
  // A handful of rows per address at most (one per scope).
  const rows = await ctx.db
    .query("emailSuppressions")
    .withIndex("by_email", (q) => q.eq("email", email))
    .take(10);
  return rows.some((row) => isSuppressedBy(template, row.scope));
}

/** Security mail data (OTP codes, export links) is cleared once the row is final. */
export function scrubbedData(row: Doc<"emailOutbox">): { data?: null } {
  return row.category === "security" ? { data: null } : {};
}
