import type { Doc } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { writeAudit } from "../lib/audit";
import { appError } from "../lib/errors";
import type { Logger } from "../lib/logger";
import { hasVerifiedIdentity } from "./profiles";

// Admin bootstrap (SPEC §6.6). Only ever creates the first admin.

const MAX_USERS_PER_EMAIL = 10;

type BootstrapCtx = MutationCtx & { rid: string; log: Logger };

async function verifiedUserByEmail(ctx: BootstrapCtx, email: string): Promise<Doc<"users">> {
  const users = await ctx.db
    .query("users")
    .withIndex("email", (q) => q.eq("email", email))
    .take(MAX_USERS_PER_EMAIL);
  if (users.length === 0) throw appError("NOT_FOUND", "No user with that email");
  for (const user of users) {
    if (await hasVerifiedIdentity(ctx, user._id)) return user;
  }
  throw appError("PRECONDITION", "Email not verified", { reason: "email_unverified" });
}

export async function bootstrapAdmin(ctx: BootstrapCtx, rawEmail: string) {
  const existingAdmin = await ctx.db
    .query("profiles")
    .withIndex("by_role", (q) => q.eq("role", "admin"))
    .first();
  if (existingAdmin !== null) throw appError("CONFLICT", "An admin already exists");

  const user = await verifiedUserByEmail(ctx, rawEmail.trim().toLowerCase());
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_userId", (q) => q.eq("userId", user._id))
    .unique();
  if (profile === null) {
    throw appError("PRECONDITION", "Finish onboarding first", { reason: "not_onboarded" });
  }
  if (profile.status !== "active") {
    throw appError("PRECONDITION", "Account is not active", { reason: profile.status });
  }

  await ctx.db.patch("profiles", profile._id, { role: "admin" });
  // No admin exists to act, so the new admin is recorded as the actor.
  await writeAudit(
    { db: ctx.db, rid: ctx.rid, viewer: { userId: user._id } },
    {
      action: "user.role.bootstrap",
      targetType: "user",
      targetId: user._id,
      before: { role: profile.role },
      after: { role: "admin" },
      reason: "bootstrap",
    },
  );
  ctx.log.info("admin.bootstrap.succeeded", { userId: user._id });
  return { userId: user._id, username: profile.username };
}
