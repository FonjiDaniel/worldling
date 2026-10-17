import { v } from "convex/values";

import type { Doc } from "../_generated/dataModel";
import { internalMutation, internalQuery } from "../_generated/server";
import schema from "../schema";
import { decryptSecret } from "../lib/crypto";
import { recordTestResult } from "../model/emailConfigs";
import { EmailSendError } from "./errors";
import type { ResolvedConfig } from "./types";

// Loads the active config (SPEC §7.4) for the dispatcher. These queries return encrypted
// secrets, so they are internal and only actions call them; decryption happens in the action.

const maybeConfig = v.union(v.null(), schema.doc("emailConfigs"));

export const activeConfig = internalQuery({
  args: {},
  returns: maybeConfig,
  handler: async (ctx) => {
    // Activation keeps a single active row; first() keeps mail flowing if that ever breaks.
    return await ctx.db
      .query("emailConfigs")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .first();
  },
});

export const configById = internalQuery({
  args: { configId: v.id("emailConfigs") },
  returns: maybeConfig,
  handler: async (ctx, { configId }) => {
    return await ctx.db.get("emailConfigs", configId);
  },
});

/** Test send result from email/testSend. Ignored when the config changed since the request. */
export const recordTest = internalMutation({
  args: {
    configId: v.id("emailConfigs"),
    fingerprint: v.string(),
    ok: v.boolean(),
    error: v.optional(v.string()),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => await recordTestResult(ctx, args),
});

/** Decrypts a stored config in memory. Missing or unreadable secrets are permanent failures. */
export async function resolveDbConfig(config: Doc<"emailConfigs">): Promise<ResolvedConfig> {
  const base = {
    source: "db" as const,
    configId: config._id,
    fromName: config.fromName,
    fromAddress: config.fromAddress,
    ...(config.replyTo !== undefined && { replyTo: config.replyTo }),
  };
  if (config.transport === "smtp") {
    const smtp = config.smtp;
    if (smtp?.password === undefined) throw new EmailSendError("permanent", "missing_secret");
    const password = await decrypt(smtp.password);
    const { host, port, secure, user } = smtp;
    return { ...base, transport: { kind: "smtp", host, port, secure, user, password } };
  }
  const apiKey = config.resend?.apiKey;
  if (apiKey === undefined) throw new EmailSendError("permanent", "missing_secret");
  return { ...base, transport: { kind: "resend", apiKey: await decrypt(apiKey) } };
}

async function decrypt(secret: Parameters<typeof decryptSecret>[0]): Promise<string> {
  try {
    return await decryptSecret(secret);
  } catch {
    throw new EmailSendError("permanent", "decrypt_failed");
  }
}
