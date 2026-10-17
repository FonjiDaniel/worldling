import { v } from "convex/values";

import { internal } from "../_generated/api";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { writeAudit } from "../lib/audit";
import { encryptSecret } from "../lib/crypto";
import { appError } from "../lib/errors";
import type { Logger } from "../lib/logger";
import { enforceRateLimit } from "../lib/rateLimits";
import { type EmailConfigInput, emailConfigInputSchema } from "../shared/emailConfig";

// Email config lifecycle (SPEC §7.4): draft -> verified (test send) -> active -> retired.
// Every change writes an audit entry in the same transaction. Secrets never leave encrypted.

export type ConfigCtx = MutationCtx & {
  rid: string;
  log: Logger;
  viewer: { userId: Id<"users"> };
};

type Config = Doc<"emailConfigs">;
type Secret = NonNullable<NonNullable<Config["smtp"]>["password"]>;

const secretHint = v.object({ configured: v.literal(true), last4: v.string() });

export const safeConfigValidator = v.object({
  _id: v.id("emailConfigs"),
  _creationTime: v.number(),
  status: v.union(
    v.literal("draft"),
    v.literal("verified"),
    v.literal("active"),
    v.literal("retired"),
  ),
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
      password: v.optional(secretHint),
    }),
  ),
  resend: v.optional(v.object({ apiKey: v.optional(secretHint) })),
  lastTest: v.optional(
    v.object({ at: v.number(), ok: v.boolean(), error: v.optional(v.string()) }),
  ),
  activatedAt: v.optional(v.number()),
  createdBy: v.id("users"),
});

export type SafeConfig = typeof safeConfigValidator.type;

function hint(secret: Secret | undefined) {
  return secret === undefined ? undefined : { configured: true as const, last4: secret.last4 };
}

/** What clients and audit entries see: `{ configured, last4 }` instead of ciphertext. */
export function toSafeView(config: Config): SafeConfig {
  const { smtp, resend, ...rest } = config;
  const password = hint(smtp?.password);
  const apiKey = hint(resend?.apiKey);
  return {
    ...rest,
    ...(smtp !== undefined && {
      smtp: {
        host: smtp.host,
        port: smtp.port,
        secure: smtp.secure,
        user: smtp.user,
        ...(password && { password }),
      },
    }),
    ...(resend !== undefined && { resend: apiKey ? { apiKey } : {} }),
  };
}

/** Changes whenever anything a test send depends on changes, so stale results are dropped. */
export function configFingerprint(config: Config): string {
  const { transport, fromName, fromAddress, replyTo, smtp, resend } = config;
  return JSON.stringify({ transport, fromName, fromAddress, replyTo, smtp, resend });
}

function parseInput(input: unknown): EmailConfigInput {
  const result = emailConfigInputSchema.safeParse(input);
  if (result.success) return result.data;
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of result.error.issues) {
    (fieldErrors[issue.path.join(".") || "config"] ??= []).push(issue.message);
  }
  throw appError("VALIDATION", "Invalid email config", { fieldErrors });
}

function missingSecret(field: string): never {
  throw appError("VALIDATION", "Secret required", { fieldErrors: { [field]: ["Required"] } });
}

/** The transport fields to store, encrypting new secrets and keeping existing ones. */
async function transportFields(input: EmailConfigInput, existing?: Config) {
  if (input.transport === "smtp" && input.smtp !== undefined) {
    const { password, ...smtp } = input.smtp;
    const stored =
      password !== undefined ? await encryptSecret(password) : existing?.smtp?.password;
    return {
      smtp: { ...smtp, password: stored ?? missingSecret("smtp.password") },
      resend: undefined,
    };
  }
  const apiKey = input.resend?.apiKey;
  const stored = apiKey !== undefined ? await encryptSecret(apiKey) : existing?.resend?.apiKey;
  return { resend: { apiKey: stored ?? missingSecret("resend.apiKey") }, smtp: undefined };
}

async function loadConfig(ctx: ConfigCtx, configId: Id<"emailConfigs">): Promise<Config> {
  const config = await ctx.db.get("emailConfigs", configId);
  if (config === null) throw appError("NOT_FOUND", "Email config not found");
  return config;
}

export async function createConfig(ctx: ConfigCtx, raw: unknown): Promise<Id<"emailConfigs">> {
  const input = parseInput(raw);
  const { smtp, resend } = await transportFields(input);
  const configId = await ctx.db.insert("emailConfigs", {
    status: "draft",
    transport: input.transport,
    fromName: input.fromName,
    fromAddress: input.fromAddress,
    ...(input.replyTo !== undefined && { replyTo: input.replyTo }),
    ...(smtp !== undefined && { smtp }),
    ...(resend !== undefined && { resend }),
    createdBy: ctx.viewer.userId,
  });
  const after = toSafeView(await loadConfig(ctx, configId));
  await writeAudit(ctx, { action: "email.config.create", ...target(configId), after });
  ctx.log.info("email.config.created", { configId, transport: input.transport });
  return configId;
}

/** Only draft and verified configs change; any change needs a new test send. */
export async function updateConfig(ctx: ConfigCtx, configId: Id<"emailConfigs">, raw: unknown) {
  const before = await loadConfig(ctx, configId);
  if (before.status !== "draft" && before.status !== "verified") {
    throw appError("PRECONDITION", "Active and retired configs can't change", {
      reason: "config_locked",
    });
  }
  const input = parseInput(raw);
  const same = input.transport === before.transport ? before : undefined;
  await ctx.db.patch("emailConfigs", configId, {
    status: "draft",
    transport: input.transport,
    fromName: input.fromName,
    fromAddress: input.fromAddress,
    replyTo: input.replyTo,
    lastTest: undefined,
    ...(await transportFields(input, same)),
  });
  const after = toSafeView(await loadConfig(ctx, configId));
  await writeAudit(ctx, {
    action: "email.config.update",
    ...target(configId),
    before: toSafeView(before),
    after,
  });
  ctx.log.info("email.config.updated", { configId });
}

/** Rate limited, sent to the admin's own address by email/testSend. */
export async function requestTestSend(ctx: ConfigCtx, configId: Id<"emailConfigs">) {
  const config = await loadConfig(ctx, configId);
  if (config.status === "retired") {
    throw appError("PRECONDITION", "Retired configs can't send", { reason: "config_retired" });
  }
  await enforceRateLimit(ctx, "admin.emailTest", ctx.viewer.userId);
  const user = await ctx.db.get("users", ctx.viewer.userId);
  if (user?.email === undefined) {
    throw appError("PRECONDITION", "Your account has no email", { reason: "no_email" });
  }
  await ctx.scheduler.runAfter(0, internal.email.testSend.run, {
    configId,
    to: user.email,
    fingerprint: configFingerprint(config),
  });
  await writeAudit(ctx, { action: "email.config.test", ...target(configId) });
}

/** `activate` needs a verified config, `rollback` a retired one. The old active one retires. */
export async function activateConfig(
  ctx: ConfigCtx,
  configId: Id<"emailConfigs">,
  mode: "activate" | "rollback",
) {
  const config = await loadConfig(ctx, configId);
  const required = mode === "activate" ? "verified" : "retired";
  if (config.status !== required) {
    throw appError("PRECONDITION", `Only ${required} configs can be used here`, {
      reason: `needs_${required}`,
    });
  }
  const current = await ctx.db
    .query("emailConfigs")
    .withIndex("by_status", (q) => q.eq("status", "active"))
    .take(10);
  for (const previous of current) {
    await ctx.db.patch("emailConfigs", previous._id, { status: "retired" });
  }
  await ctx.db.patch("emailConfigs", configId, { status: "active", activatedAt: Date.now() });
  await writeAudit(ctx, {
    action: `email.config.${mode}`,
    ...target(configId),
    before: { activeIds: current.map((previous) => previous._id) },
    after: { activeId: configId },
  });
  ctx.log.info("email.config.activated", { configId, mode, retired: current.length });
}

/** Stores a test result. A pass verifies a draft, a fail sends a verified config back to draft. */
export async function recordTestResult(
  ctx: MutationCtx,
  args: { configId: Id<"emailConfigs">; fingerprint: string; ok: boolean; error?: string },
) {
  const config = await ctx.db.get("emailConfigs", args.configId);
  if (config === null || configFingerprint(config) !== args.fingerprint) return false;
  const lastTest = { at: Date.now(), ok: args.ok, ...(args.error && { error: args.error }) };
  let status = config.status;
  if (args.ok && status === "draft") status = "verified";
  if (!args.ok && status === "verified") status = "draft";
  await ctx.db.patch("emailConfigs", config._id, { lastTest, status });
  return true;
}

function target(configId: Id<"emailConfigs">) {
  return { targetType: "emailConfig", targetId: configId };
}
