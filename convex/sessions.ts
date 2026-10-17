import { v } from "convex/values";

import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";
import { signedInMutation } from "./lib/functions";
import { createLogger } from "./lib/logger";
import { revokeSessionsBatch } from "./model/sessions";

/** Signs the viewer out everywhere, this device included (SPEC §6.4). Works while suspended. */
export const signOutEverywhere = signedInMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const more = await revokeSessionsBatch(ctx, ctx.viewer.userId);
    if (more) {
      await ctx.scheduler.runAfter(0, internal.sessions.continueRevoke, {
        userId: ctx.viewer.userId,
        rid: ctx.rid,
      });
    }
    ctx.log.info("session.revoke_all.succeeded", { more });
    return null;
  },
});

export const continueRevoke = internalMutation({
  args: { userId: v.id("users"), rid: v.string() },
  returns: v.null(),
  handler: async (ctx, { userId, rid }) => {
    if (await revokeSessionsBatch(ctx, userId)) {
      await ctx.scheduler.runAfter(0, internal.sessions.continueRevoke, { userId, rid });
      return null;
    }
    createLogger({ rid, fn: "sessions:continueRevoke", uid: userId }).info(
      "session.revoke_all.finished",
    );
    return null;
  },
});
