"use node";

import { v } from "convex/values";

import { internal } from "../_generated/api";
import { internalJobAction } from "../lib/functions";
import { composeEmail } from "./compose";
import { resolveDbConfig } from "./config";
import { classifySendError } from "./errors";
import { createProvider } from "./providers";

// Transport test (SPEC §7.4 step 2). Sends `admin.test` straight through one config, not the
// outbox, and records the result. A pass turns a draft into a verified config.

export const run = internalJobAction({
  args: { configId: v.id("emailConfigs"), to: v.string(), fingerprint: v.string() },
  returns: v.null(),
  handler: async (ctx, { configId, to, fingerprint }) => {
    const config = await ctx.runQuery(internal.email.config.configById, { configId });
    if (config === null) return null;
    let result: { ok: true } | { ok: false; error: string };
    try {
      const resolved = await resolveDbConfig(config);
      const message = await composeEmail(resolved, {
        to,
        template: "admin.test",
        data: { transport: config.transport, source: "db" },
      });
      await createProvider(resolved).send(message);
      result = { ok: true };
      ctx.log.info("email.test.ok", { configId, transport: config.transport });
    } catch (error) {
      const { reason } = classifySendError(error);
      result = { ok: false, error: reason };
      ctx.log.warn("email.test.failed", { configId, transport: config.transport, reason });
    }
    await ctx.runMutation(internal.email.config.recordTest, { configId, fingerprint, ...result });
    return null;
  },
});
