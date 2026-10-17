import { vOnCompleteArgs } from "@convex-dev/workpool";
import { v } from "convex/values";

import type { Doc } from "../_generated/dataModel";
import { internalMutation, type MutationCtx } from "../_generated/server";
import { appError } from "../lib/errors";
import { createLogger } from "../lib/logger";
import { enqueueEmail, scrubbedData } from "../model/emailOutbox";
import { isEmailTemplateKey } from "../shared/emailTemplates";

// Outbox state changes (SPEC §7.2). Domain code calls model/emailOutbox.enqueueEmail directly;
// `enqueue` is the same thing as an internal mutation for the CLI and actions.

const TERMINAL = new Set<Doc<"emailOutbox">["status"]>([
  "sent",
  "failed",
  "suppressed",
  "cancelled",
]);
const REASON = /(retryable|permanent):([a-z0-9_]+)/;
const MAX_REASON_LENGTH = 64;

export const enqueue = internalMutation({
  args: { to: v.string(), template: v.string(), data: v.any(), idempotencyKey: v.string() },
  returns: v.object({ outboxId: v.id("emailOutbox"), status: v.string(), deduped: v.boolean() }),
  handler: async (ctx, { template, ...input }) => {
    const rid = crypto.randomUUID();
    const log = createLogger({ rid, fn: "email/outbox:enqueue" });
    if (!isEmailTemplateKey(template)) {
      throw appError("VALIDATION", "Unknown template", { fieldErrors: { template: ["Unknown"] } });
    }
    return await enqueueEmail({ ...ctx, rid, log }, { ...input, template });
  },
});

/** Marks the row as sending and counts the attempt. Null when there is nothing left to send. */
export const claim = internalMutation({
  args: { outboxId: v.id("emailOutbox") },
  returns: v.union(
    v.null(),
    v.object({
      to: v.string(),
      template: v.string(),
      data: v.any(),
      category: v.string(),
      attempts: v.number(),
      idempotencyKey: v.string(),
    }),
  ),
  handler: async (ctx, { outboxId }) => {
    const row = await ctx.db.get("emailOutbox", outboxId);
    if (row === null || TERMINAL.has(row.status)) return null;
    const attempts = row.attempts + 1;
    await ctx.db.patch("emailOutbox", outboxId, { status: "sending", attempts });
    const data: unknown = row.data;
    const { to, template, category, idempotencyKey } = row;
    return { to, template, data, category, attempts, idempotencyKey };
  },
});

export const markSent = internalMutation({
  args: { outboxId: v.id("emailOutbox"), provider: v.string(), providerMessageId: v.string() },
  returns: v.null(),
  handler: async (ctx, { outboxId, provider, providerMessageId }) => {
    const row = await ctx.db.get("emailOutbox", outboxId);
    if (row === null) return null;
    await ctx.db.patch("emailOutbox", outboxId, {
      status: "sent",
      provider,
      providerMessageId,
      sentAt: Date.now(),
      lastError: undefined,
      ...scrubbedData(row),
    });
    return null;
  },
});

export const markFailed = internalMutation({
  args: { outboxId: v.id("emailOutbox"), reason: v.string(), provider: v.optional(v.string()) },
  returns: v.null(),
  handler: async (ctx, { outboxId, reason, provider }) => {
    await fail(ctx, outboxId, reason, provider);
    return null;
  },
});

/** Workpool callback. `failed` here means every retry is used up. */
export const onComplete = internalMutation({
  args: vOnCompleteArgs(v.object({ outboxId: v.id("emailOutbox") })),
  returns: v.null(),
  handler: async (ctx, { context, result }) => {
    if (result.kind === "success") return null;
    if (result.kind === "canceled") {
      const row = await ctx.db.get("emailOutbox", context.outboxId);
      if (row !== null && !TERMINAL.has(row.status)) {
        await ctx.db.patch("emailOutbox", row._id, { status: "cancelled", ...scrubbedData(row) });
      }
      return null;
    }
    const reason = REASON.exec(result.error)?.[2] ?? "unknown";
    const row = await fail(ctx, context.outboxId, `retries_exhausted:${reason}`);
    if (row !== null) {
      await ctx.db.insert("systemEvents", {
        level: "error",
        source: "email.dispatch",
        code: "email.dispatch.failed",
        message: "Email failed after every retry",
        context: { outboxId: row._id, template: row.template, attempts: row.attempts, reason },
        rid: row.rid,
      });
    }
    return null;
  },
});

/** Fails a row that isn't final yet. Returns the row, or null when nothing changed. */
async function fail(
  ctx: MutationCtx,
  outboxId: Doc<"emailOutbox">["_id"],
  reason: string,
  provider?: string,
): Promise<Doc<"emailOutbox"> | null> {
  const row = await ctx.db.get("emailOutbox", outboxId);
  if (row === null || TERMINAL.has(row.status)) return null;
  await ctx.db.patch("emailOutbox", outboxId, {
    status: "failed",
    lastError: reason.slice(0, MAX_REASON_LENGTH),
    ...(provider !== undefined && { provider }),
    ...scrubbedData(row),
  });
  return row;
}
