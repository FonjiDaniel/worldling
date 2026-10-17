import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

// Sign out of all devices (SPEC §6.4). Convex Auth's invalidateSessions needs an action, so
// this deletes the rows directly, in bounded batches.

export const SESSION_BATCH = 100;

/** Deletes up to SESSION_BATCH sessions (and their refresh tokens). True when more remain. */
export async function revokeSessionsBatch(ctx: MutationCtx, userId: Id<"users">): Promise<boolean> {
  const sessions = await ctx.db
    .query("authSessions")
    .withIndex("userId", (q) => q.eq("userId", userId))
    .take(SESSION_BATCH);
  for (const session of sessions) {
    const tokens = await ctx.db
      .query("authRefreshTokens")
      .withIndex("sessionId", (q) => q.eq("sessionId", session._id))
      .take(SESSION_BATCH);
    for (const token of tokens) await ctx.db.delete("authRefreshTokens", token._id);
    // A session with more tokens than one batch keeps its row until the next pass.
    if (tokens.length < SESSION_BATCH) await ctx.db.delete("authSessions", session._id);
  }
  return sessions.length === SESSION_BATCH;
}
