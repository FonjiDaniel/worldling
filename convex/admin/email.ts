import { v } from "convex/values";

import { envTransportSummary } from "../email/envConfig";
import { adminMutation, adminQuery } from "../lib/functions";
import * as emailConfigs from "../model/emailConfigs";
import { isGmailHost } from "../shared/emailConfig";

// Admin email transport functions (SPEC §7.4, §9). The UI arrives in Phase 10.
// Responses never include ciphertext; secrets show as { configured, last4 }.

const MAX_CONFIGS = 50;

const configInput = {
  transport: v.union(v.literal("smtp"), v.literal("resend")),
  fromName: v.string(),
  fromAddress: v.string(),
  replyTo: v.optional(v.string()),
  smtp: v.optional(
    v.object({
      host: v.string(),
      port: v.number(),
      secure: v.boolean(),
      user: v.string(),
      password: v.optional(v.string()),
    }),
  ),
  resend: v.optional(v.object({ apiKey: v.optional(v.string()) })),
};

export const listConfigs = adminQuery({
  args: {},
  returns: v.array(emailConfigs.safeConfigValidator),
  handler: async (ctx) => {
    const configs = await ctx.db.query("emailConfigs").order("desc").take(MAX_CONFIGS);
    return configs.map(emailConfigs.toSafeView);
  },
});

export const overview = adminQuery({
  args: {},
  returns: v.object({
    source: v.union(v.literal("db"), v.literal("env"), v.literal("none")),
    active: v.union(v.null(), emailConfigs.safeConfigValidator),
    env: v.union(v.null(), v.object({ transport: v.string(), host: v.optional(v.string()) })),
    gmailQuotaWarning: v.boolean(),
  }),
  handler: async (ctx) => {
    const active = await ctx.db
      .query("emailConfigs")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .first();
    const env = envTransportSummary();
    const host = active !== null ? active.smtp?.host : env?.host;
    const smtp = (active?.transport ?? env?.transport) === "smtp";
    const source: "db" | "env" | "none" = active !== null ? "db" : env !== null ? "env" : "none";
    return {
      source,
      active: active === null ? null : emailConfigs.toSafeView(active),
      env,
      gmailQuotaWarning: smtp && isGmailHost(host),
    };
  },
});

export const createConfig = adminMutation({
  args: configInput,
  returns: v.id("emailConfigs"),
  handler: async (ctx, args) => await emailConfigs.createConfig(ctx, args),
});

export const updateConfig = adminMutation({
  args: { configId: v.id("emailConfigs"), ...configInput },
  returns: v.null(),
  handler: async (ctx, { configId, ...input }) => {
    await emailConfigs.updateConfig(ctx, configId, input);
    return null;
  },
});

export const requestTestSend = adminMutation({
  args: { configId: v.id("emailConfigs") },
  returns: v.null(),
  handler: async (ctx, { configId }) => {
    await emailConfigs.requestTestSend(ctx, configId);
    return null;
  },
});

export const activate = adminMutation({
  args: { configId: v.id("emailConfigs") },
  returns: v.null(),
  handler: async (ctx, { configId }) => {
    await emailConfigs.activateConfig(ctx, configId, "activate");
    return null;
  },
});

export const rollbackTo = adminMutation({
  args: { configId: v.id("emailConfigs") },
  returns: v.null(),
  handler: async (ctx, { configId }) => {
    await emailConfigs.activateConfig(ctx, configId, "rollback");
    return null;
  },
});
