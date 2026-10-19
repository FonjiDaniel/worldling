import type { PaginationOptions, PaginationResult } from "convex/server";

import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { appError } from "../lib/errors";
import type { Viewer } from "../lib/functions";

// Comets (SPEC §2.6). Phase 7 reads them; sending, hiding and reports arrive in Phase 9.

export const COMET_PAGE_MAX = 30;

export interface CometView {
  _id: Id<"comets">;
  _creationTime: number;
  body: string;
  status: "visible" | "pending";
  /** Null when the author's account isn't active. */
  author: { username: string; displayName: string } | null;
}

async function authorOf(ctx: Pick<QueryCtx, "db">, userId: Id<"users">) {
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();
  if (profile?.status !== "active") return null;
  return { username: profile.username, displayName: profile.displayName };
}

async function cometView(ctx: Pick<QueryCtx, "db">, comet: Doc<"comets">): Promise<CometView> {
  return {
    _id: comet._id,
    _creationTime: comet._creationTime,
    body: comet.body,
    status: comet.status === "pending" ? "pending" : "visible",
    author: await authorOf(ctx, comet.authorId),
  };
}

export interface ListArgs {
  worldId: Id<"worlds">;
  status: "visible" | "pending";
  paginationOpts: PaginationOptions;
}

/** Newest first. Everyone sees visible comets of a public world; only the owner sees pending. */
export async function listForWorld(
  ctx: Pick<QueryCtx, "db">,
  viewer: Viewer | null,
  { worldId, status, paginationOpts }: ListArgs,
): Promise<PaginationResult<CometView>> {
  const world = await ctx.db.get("worlds", worldId);
  if (world?.visibility !== "public") throw appError("NOT_FOUND", "World not found");
  if (status === "pending" && viewer?.userId !== world.ownerId) {
    throw appError("FORBIDDEN", "Only the owner reviews comets");
  }
  if (paginationOpts.numItems > COMET_PAGE_MAX) {
    throw appError("VALIDATION", "Page too large", { fieldErrors: { numItems: ["max"] } });
  }
  const result = await ctx.db
    .query("comets")
    .withIndex("by_world_status", (q) => q.eq("worldId", worldId).eq("status", status))
    .order("desc")
    .paginate(paginationOpts);
  return { ...result, page: await Promise.all(result.page.map((c) => cometView(ctx, c))) };
}
