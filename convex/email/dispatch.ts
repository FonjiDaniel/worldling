"use node";

import { v } from "convex/values";

import { internal } from "../_generated/api";
import { internalJobAction } from "../lib/functions";
import { isEmailTemplateKey } from "../shared/emailTemplates";
import { composeEmail, loadActiveConfig } from "./compose";
import { classifySendError, EmailSendError } from "./errors";
import { createProvider } from "./providers";

// Sends one outbox row (SPEC §7.2). Run by the email workpool.
// Retryable failures throw, so the workpool retries with backoff and calls outbox.onComplete
// when retries run out. Permanent failures fail the row here and return normally.

export const send = internalJobAction({
  args: { outboxId: v.id("emailOutbox") },
  returns: v.null(),
  handler: async (ctx, { outboxId }) => {
    const job = await ctx.runMutation(internal.email.outbox.claim, { outboxId });
    if (job === null) {
      ctx.log.info("email.dispatch.skipped", { outboxId });
      return null;
    }
    const { template, attempts } = job;
    let provider: string | undefined;
    try {
      if (!isEmailTemplateKey(template)) {
        throw new EmailSendError("permanent", "unknown_template");
      }
      const config = await loadActiveConfig(ctx);
      const message = await composeEmail(config, {
        to: job.to,
        template,
        data: job.data,
        idempotencyKey: outboxId,
      });
      const sender = createProvider(config);
      provider = sender.name;
      const { messageId } = await sender.send(message);
      await ctx.runMutation(internal.email.outbox.markSent, {
        outboxId,
        provider,
        providerMessageId: messageId,
      });
      ctx.log.info("email.dispatch.sent", { outboxId, template, provider, source: config.source });
      return null;
    } catch (error) {
      const { kind, reason } = classifySendError(error);
      if (kind === "retryable") {
        ctx.log.info("email.dispatch.retry", { outboxId, template, provider, reason, attempts });
        throw new EmailSendError(kind, reason);
      }
      await ctx.runMutation(internal.email.outbox.markFailed, {
        outboxId,
        reason,
        ...(provider !== undefined && { provider }),
      });
      ctx.log.error("email.dispatch.failed", { outboxId, template, provider, reason, attempts });
      return null;
    }
  },
});
