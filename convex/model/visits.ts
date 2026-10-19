import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { appError } from "../lib/errors";
import type { ActiveViewer } from "../lib/functions";
import type { Logger } from "../lib/logger";
import { enforceRateLimit } from "../lib/rateLimits";
import { utcDay } from "../lib/time";
import { enqueueBloom } from "./bloom";
import { hasVerifiedIdentity } from "./profiles";

// Tending and visits (SPEC §2.2, §2.4). Both are idempotent per UTC day through the
// worldVisits index; a tend is the owner's own daily marker (ADR-023). Bloom XP is queued.

type WriteCtx = MutationCtx & { log: Logger; viewer: ActiveViewer };

async function markDay(ctx: WriteCtx, worldId: Id<"worlds">, day: string): Promise<boolean> {
  const visitorId = ctx.viewer.userId;
  const existing = await ctx.db
    .query("worldVisits")
    .withIndex("by_world_visitor_day", (q) =>
      q.eq("worldId", worldId).eq("visitorId", visitorId).eq("day", day),
    )
    .unique();
  if (existing !== null) return false;
  await ctx.db.insert("worldVisits", { worldId, visitorId, day });
  return true;
}

async function visibleWorld(ctx: WriteCtx, worldId: Id<"worlds">): Promise<Doc<"worlds">> {
  const world = await ctx.db.get("worlds", worldId);
  if (world?.visibility !== "public") throw appError("NOT_FOUND", "World not found");
  return world;
}

/** The owner's first open of the day. Returns whether this call counted. */
export async function tendWorld(ctx: WriteCtx, worldId: Id<"worlds">): Promise<boolean> {
  const world = await visibleWorld(ctx, worldId);
  if (world.ownerId !== ctx.viewer.userId) throw appError("FORBIDDEN", "Not your world");
  const day = utcDay(Date.now());
  const fresh = await markDay(ctx, worldId, day);
  if (fresh) await enqueueBloom(ctx, { worldId, kind: "tend", actorId: ctx.viewer.userId, day });
  ctx.log.info(fresh ? "world.tend.counted" : "world.tend.deduped", { worldId });
  return fresh;
}

export type VisitResult =
  { counted: true } | { counted: false; reason: "owner" | "unverified" | "blocked" | "already" };

async function isBlockedBy(
  ctx: WriteCtx,
  blockerId: Id<"users">,
  blockedId: Id<"users">,
): Promise<boolean> {
  const block = await ctx.db
    .query("blocks")
    .withIndex("by_pair", (q) => q.eq("blockerId", blockerId).eq("blockedId", blockedId))
    .first();
  return block !== null;
}

/** A visit after 3s of visible dwell. One per visitor per world per UTC day. */
export async function recordVisit(ctx: WriteCtx, worldId: Id<"worlds">): Promise<VisitResult> {
  const visitorId = ctx.viewer.userId;
  await enforceRateLimit(ctx, "visit.record", visitorId);
  const world = await visibleWorld(ctx, worldId);
  const result = await visitOutcome(ctx, world);
  ctx.log.info(result.counted ? "world.visit.counted" : "world.visit.skipped", {
    worldId,
    ...(!result.counted && { reason: result.reason }),
  });
  return result;
}

async function visitOutcome(ctx: WriteCtx, world: Doc<"worlds">): Promise<VisitResult> {
  const visitorId = ctx.viewer.userId;
  if (world.ownerId === visitorId) return { counted: false, reason: "owner" };
  if (!(await hasVerifiedIdentity(ctx, visitorId))) return { counted: false, reason: "unverified" };
  if (await isBlockedBy(ctx, world.ownerId, visitorId))
    return { counted: false, reason: "blocked" };
  const day = utcDay(Date.now());
  if (!(await markDay(ctx, world._id, day))) return { counted: false, reason: "already" };
  await enqueueBloom(ctx, { worldId: world._id, kind: "visit", actorId: visitorId, day });
  return { counted: true };
}
