import { v } from "convex/values";

import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";
import { syncWorldPin } from "./model/pins";
import { refreshRails } from "./model/rails";

// One-off data migrations, run once per deployment with `npx convex run migrations:<name>`.

const PIN_BACKFILL_BATCH = 200;

/** Creates worldPins for worlds made before Phase 8 (ADR-024). Safe to run again. */
export const backfillWorldPins = internalMutation({
  args: { cursor: v.optional(v.union(v.string(), v.null())) },
  returns: v.null(),
  handler: async (ctx, { cursor = null }) => {
    const page = await ctx.db
      .query("worlds")
      .withIndex("by_slot")
      .paginate({ numItems: PIN_BACKFILL_BATCH, cursor });
    for (const world of page.page) await syncWorldPin(ctx, world._id);
    if (page.isDone) await refreshRails(ctx);
    else {
      await ctx.scheduler.runAfter(0, internal.migrations.backfillWorldPins, {
        cursor: page.continueCursor,
      });
    }
    return null;
  },
});
