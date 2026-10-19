import { paginationOptsValidator, paginationResultValidator } from "convex/server";
import { v } from "convex/values";

import { publicQuery } from "./lib/functions";
import { listForWorld as listComets } from "./model/comets";

// Comets (SPEC §5.5). Read-only until Phase 9 adds send, remove and hide.

const cometValidator = v.object({
  _id: v.id("comets"),
  _creationTime: v.number(),
  body: v.string(),
  status: v.union(v.literal("visible"), v.literal("pending")),
  author: v.union(v.null(), v.object({ username: v.string(), displayName: v.string() })),
});

/** Newest first. `pending` is for the world's owner only. */
export const listForWorld = publicQuery({
  args: {
    worldId: v.id("worlds"),
    status: v.optional(v.union(v.literal("visible"), v.literal("pending"))),
    paginationOpts: paginationOptsValidator,
  },
  returns: paginationResultValidator(cometValidator),
  handler: async (ctx, { worldId, status = "visible", paginationOpts }) =>
    await listComets(ctx, ctx.viewer, { worldId, status, paginationOpts }),
});
