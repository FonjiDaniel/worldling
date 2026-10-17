import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { redact } from "./logger";

export interface AuditCtx {
  db: MutationCtx["db"];
  rid: string;
  viewer: { userId: Id<"users"> };
}

export interface AuditEntry {
  action: string; // e.g. "user.suspend", "settings.update"
  targetType: string;
  targetId: string;
  before?: unknown;
  after?: unknown;
  reason?: string;
}

/**
 * Records a staff or admin action in the same transaction as the change (SPEC §5.3).
 * `before` and `after` are redacted, so secret-named keys never reach the audit log.
 */
export async function writeAudit(ctx: AuditCtx, entry: AuditEntry): Promise<Id<"auditLog">> {
  return await ctx.db.insert("auditLog", {
    actorId: ctx.viewer.userId,
    action: entry.action,
    targetType: entry.targetType,
    targetId: entry.targetId,
    rid: ctx.rid,
    ...(entry.before !== undefined && { before: redact(entry.before) }),
    ...(entry.after !== undefined && { after: redact(entry.after) }),
    ...(entry.reason !== undefined && { reason: entry.reason }),
  });
}
