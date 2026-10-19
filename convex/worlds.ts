import { v } from "convex/values";

import { publicQuery, userMutation, userQuery } from "./lib/functions";
import {
  getByUsername as findByUsername,
  primaryWorld,
  setCometReview as applyCometReview,
  setThumbnail as applyThumbnail,
  thumbnailUploadUrl,
  updateWorld,
  worldView,
} from "./model/worlds";
import { recordVisit as applyVisit, tendWorld } from "./model/visits";
import { worldParamsV1 } from "./schema";

// Worlds (SPEC §5.5). Logic lives in model/worlds.ts.

const worldViewValidator = v.object({
  _id: v.id("worlds"),
  name: v.string(),
  params: worldParamsV1,
  level: v.number(),
  xp: v.number(),
  thumbnailUrl: v.union(v.null(), v.string()),
});

/** The viewer's primary world. Null only for accounts from before worlds existed. */
export const mine = userQuery({
  args: {},
  returns: v.union(v.null(), worldViewValidator),
  handler: async (ctx) => {
    const world = await primaryWorld(ctx, ctx.viewer.userId);
    return world === null ? null : await worldView(ctx, world);
  },
});

/** A public world and its owner. Null for unknown names, hidden worlds and inactive owners. */
export const getByUsername = publicQuery({
  args: { username: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      world: worldViewValidator,
      owner: v.object({ username: v.string(), displayName: v.string() }),
      isOwner: v.boolean(),
      cometReview: v.union(v.null(), v.boolean()),
    }),
  ),
  handler: async (ctx, { username }) => await findByUsername(ctx, ctx.viewer, username),
});

export const update = userMutation({
  args: {
    worldId: v.id("worlds"),
    name: v.optional(v.string()),
    params: v.optional(worldParamsV1),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await updateWorld(ctx, args);
    return null;
  },
});

export const generateThumbnailUploadUrl = userMutation({
  args: { worldId: v.id("worlds") },
  returns: v.string(),
  handler: async (ctx, { worldId }) => await thumbnailUploadUrl(ctx, worldId),
});

export const setThumbnail = userMutation({
  args: { worldId: v.id("worlds"), storageId: v.id("_storage") },
  returns: v.union(
    v.object({ ok: v.literal(true) }),
    v.object({
      ok: v.literal(false),
      reason: v.union(v.literal("missing"), v.literal("type"), v.literal("size")),
    }),
  ),
  handler: async (ctx, { worldId, storageId }) => await applyThumbnail(ctx, worldId, storageId),
});

/** The owner's first open of the day (SPEC §2.2 Return). Idempotent per UTC day. */
export const tend = userMutation({
  args: { worldId: v.id("worlds") },
  returns: v.object({ tended: v.boolean() }),
  handler: async (ctx, { worldId }) => ({ tended: await tendWorld(ctx, worldId) }),
});

/** A visit after 3s of visible dwell (SPEC §2.2 Visit). Idempotent per visitor per day. */
export const recordVisit = userMutation({
  args: { worldId: v.id("worlds") },
  returns: v.union(
    v.object({ counted: v.literal(true) }),
    v.object({
      counted: v.literal(false),
      reason: v.union(
        v.literal("owner"),
        v.literal("unverified"),
        v.literal("blocked"),
        v.literal("already"),
      ),
    }),
  ),
  handler: async (ctx, { worldId }) => await applyVisit(ctx, worldId),
});

export const setCometReview = userMutation({
  args: { worldId: v.id("worlds"), enabled: v.boolean() },
  returns: v.null(),
  handler: async (ctx, { worldId, enabled }) => {
    await applyCometReview(ctx, worldId, enabled);
    return null;
  },
});
