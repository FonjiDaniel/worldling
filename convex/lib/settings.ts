import { z } from "zod";

import type { QueryCtx } from "../_generated/server";
import { type AuditCtx, writeAudit } from "./audit";
import { appError } from "./errors";
import type { Logger } from "./logger";

// Typed settings registry (SPEC §9 Settings). The `settings` table stores `value: any`;
// every read and write goes through these schemas.

interface SettingDefinition<S extends z.ZodType> {
  schema: S;
  default: z.infer<S>;
}

function define<S extends z.ZodType>(schema: S, defaultValue: z.infer<S>): SettingDefinition<S> {
  return { schema, default: defaultValue };
}

const flag = (defaultValue: boolean) => define(z.boolean(), defaultValue);
const wordList = define(z.array(z.string().trim().min(1).max(64)).max(1000), []);

export const SETTINGS = {
  maintenance: define(z.object({ enabled: z.boolean(), message: z.string().max(280) }), {
    enabled: false,
    message: "",
  }),
  "signups.enabled": flag(true),
  "comets.enabled": flag(true),
  "universe.live": flag(true),
  "shop.enabled": flag(false),
  "digest.enabled": flag(true),
  "moderation.extraWords": wordList,
  "usernames.reserved": wordList,
};

export type SettingKey = keyof typeof SETTINGS;
export type SettingValue<K extends SettingKey> = z.infer<(typeof SETTINGS)[K]["schema"]>;
export type FlagKey = {
  [K in SettingKey]: SettingValue<K> extends boolean ? K : never;
}[SettingKey];

interface ReadCtx {
  db: QueryCtx["db"];
  log?: Logger;
}

async function findRow(ctx: ReadCtx, key: SettingKey) {
  return await ctx.db
    .query("settings")
    .withIndex("by_key", (q) => q.eq("key", key))
    .unique();
}

/** The stored value, or the registry default when unset or invalid (invalid is logged). */
export async function getSetting<K extends SettingKey>(
  ctx: ReadCtx,
  key: K,
): Promise<SettingValue<K>> {
  const definition = SETTINGS[key];
  const row = await findRow(ctx, key);
  if (row === null) return definition.default as SettingValue<K>;
  const parsed = definition.schema.safeParse(row.value);
  if (parsed.success) return parsed.data as SettingValue<K>;
  ctx.log?.warn("settings.read.invalid", { key });
  return definition.default as SettingValue<K>;
}

export async function isFlagOn(ctx: ReadCtx, key: FlagKey): Promise<boolean> {
  return await getSetting(ctx, key);
}

/** Validates, upserts and audits a setting. Admin mutations only. */
export async function setSetting<K extends SettingKey>(
  ctx: AuditCtx,
  key: K,
  value: unknown,
): Promise<SettingValue<K>> {
  const parsed = SETTINGS[key].schema.safeParse(value);
  if (!parsed.success) {
    const messages = parsed.error.issues.map((issue) => issue.message);
    throw appError("VALIDATION", `Invalid value for setting ${key}`, {
      fieldErrors: { value: messages },
    });
  }
  const next = parsed.data as SettingValue<K>;
  const row = await findRow(ctx, key);
  const fields = { value: next, updatedBy: ctx.viewer.userId, updatedAt: Date.now() };
  if (row === null) await ctx.db.insert("settings", { key, ...fields });
  else await ctx.db.patch(row._id, fields);
  await writeAudit(ctx, {
    action: "settings.update",
    targetType: "setting",
    targetId: key,
    before: row?.value,
    after: next,
  });
  return next;
}
