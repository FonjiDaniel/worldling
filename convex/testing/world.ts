import { v } from "convex/values";

import type { Doc } from "../_generated/dataModel";
import { internalMutation, internalQuery, type QueryCtx } from "../_generated/server";
import { isE2eRecipient } from "../email/envConfig";
import { primaryWorld } from "../model/worlds";
import { assertEnabled } from "./e2e";

// World helpers for the Phase 7 e2e (ADR-016 rules: internal, never on production).

async function worldOf(ctx: Pick<QueryCtx, "db">, email: string): Promise<Doc<"worlds">> {
  assertEnabled();
  if (!isE2eRecipient(email)) throw new Error("Not an e2e recipient");
  const user = await ctx.db
    .query("users")
    .withIndex("email", (q) => q.eq("email", email.toLowerCase()))
    .first();
  const world = user === null ? null : await primaryWorld(ctx, user._id);
  if (world === null) throw new Error("No world for this account");
  return world;
}

export const worldState = internalQuery({
  args: { email: v.string(), day: v.string() },
  returns: v.object({
    xp: v.number(),
    level: v.number(),
    cometReview: v.boolean(),
    visits: v.number(),
    hasThumbnail: v.boolean(),
  }),
  handler: async (ctx, { email, day }) => {
    const world = await worldOf(ctx, email);
    const stats = await ctx.db
      .query("worldStatsDaily")
      .withIndex("by_world_day", (q) => q.eq("worldId", world._id).eq("day", day))
      .unique();
    return {
      xp: world.bloom.xp,
      level: world.bloom.level,
      cometReview: world.cometReview,
      visits: stats?.visits ?? 0,
      hasThumbnail: world.thumbnailId !== undefined,
    };
  },
});

/** Visible comets from the owner to their own world, so the list and streaks have data. */
export const seedComets = internalMutation({
  args: { email: v.string(), bodies: v.array(v.string()) },
  returns: v.null(),
  handler: async (ctx, { email, bodies }) => {
    const world = await worldOf(ctx, email);
    for (const body of bodies.slice(0, 20)) {
      await ctx.db.insert("comets", {
        worldId: world._id,
        authorId: world.ownerId,
        body,
        status: "visible",
        reportCount: 0,
      });
    }
    return null;
  },
});

export const clearThumbnail = internalMutation({
  args: { email: v.string() },
  returns: v.null(),
  handler: async (ctx, { email }) => {
    const world = await worldOf(ctx, email);
    if (world.thumbnailId === undefined) return null;
    await ctx.storage.delete(world.thumbnailId);
    await ctx.db.patch("worlds", world._id, { thumbnailId: undefined });
    return null;
  },
});
