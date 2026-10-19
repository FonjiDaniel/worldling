import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { appError } from "../lib/errors";
import type { ActiveViewer, Viewer } from "../lib/functions";
import type { Logger } from "../lib/logger";
import { enforceRateLimit } from "../lib/rateLimits";
import { getSetting } from "../lib/settings";
import { sectorKeyForSlot } from "../shared/galaxy";
import { checkText } from "../shared/moderation";
import {
  THUMBNAIL_MAX_BYTES,
  THUMBNAIL_TYPE,
  type WorldParams,
  worldNameSchema,
  worldParamsSchema,
} from "../shared/worldParams";

// Worlds (SPEC §5.2, §5.7, §8.7). Onboarding creates the primary world (ADR-017), the creator
// edits it (Phase 6) and Phase 8 adds the universe queries.

type ReadCtx = Pick<QueryCtx, "db" | "storage">;
type WriteCtx = MutationCtx & { log: Logger; viewer: ActiveViewer };

/**
 * Takes the next galaxy slot from the singleton. Concurrent creations conflict on this one
 * document and Convex retries them, so slots are never shared or reused (§5.7).
 */
export async function allocateSlot(ctx: MutationCtx): Promise<number> {
  const galaxy = await ctx.db.query("galaxy").first();
  if (galaxy === null) {
    await ctx.db.insert("galaxy", { nextSlot: 1 });
    return 0;
  }
  await ctx.db.patch("galaxy", galaxy._id, { nextSlot: galaxy.nextSlot + 1 });
  return galaxy.nextSlot;
}

export interface NewWorld {
  ownerId: Id<"users">;
  name: string;
  params: WorldParams;
}

export async function createPrimaryWorld(ctx: MutationCtx, world: NewWorld): Promise<Id<"worlds">> {
  const slot = await allocateSlot(ctx);
  return await ctx.db.insert("worlds", {
    ...world,
    isPrimary: true,
    slot,
    sectorKey: sectorKeyForSlot(slot),
    bloom: { xp: 0, level: 1, streak: 0 },
    visibility: "public",
    cometReview: false,
    updatedAt: Date.now(),
  });
}

function invalid(field: string, problem: string): never {
  throw appError("VALIDATION", `Invalid ${field}`, { fieldErrors: { [field]: [problem] } });
}

/** Clamped params, or a VALIDATION error on `field`. Shared by onboarding and updates. */
export function parseWorldParams(raw: unknown, field = "params"): WorldParams {
  const parsed = worldParamsSchema.safeParse(raw);
  if (!parsed.success) invalid(field, "params");
  return parsed.data;
}

/** A normalized, moderated world name, or a VALIDATION error on `field`. */
export function parseWorldName(
  raw: string,
  extraWords: readonly string[] = [],
  field = "name",
): string {
  const parsed = worldNameSchema.safeParse(raw.slice(0, 200));
  if (!parsed.success) invalid(field, "length");
  if (!checkText(parsed.data, extraWords).ok) invalid(field, "moderation");
  return parsed.data;
}

const OWNER_SCAN = 10;

/** The owner's primary world. One per account in v1, so the scan is tiny. */
export async function primaryWorld(
  ctx: Pick<QueryCtx, "db">,
  ownerId: Id<"users">,
): Promise<Doc<"worlds"> | null> {
  const worlds = await ctx.db
    .query("worlds")
    .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
    .take(OWNER_SCAN);
  return worlds.find((world) => world.isPrimary) ?? null;
}

export interface WorldView {
  _id: Id<"worlds">;
  name: string;
  params: WorldParams;
  level: number;
  xp: number;
  thumbnailUrl: string | null;
}

export async function worldView(ctx: ReadCtx, world: Doc<"worlds">): Promise<WorldView> {
  return {
    _id: world._id,
    name: world.name,
    params: world.params,
    level: world.bloom.level,
    xp: world.bloom.xp,
    thumbnailUrl:
      world.thumbnailId === undefined ? null : await ctx.storage.getUrl(world.thumbnailId),
  };
}

export async function getByUsername(ctx: ReadCtx, viewer: Viewer | null, raw: string) {
  const username = raw.trim().toLowerCase().slice(0, 64);
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_username", (q) => q.eq("username", username))
    .unique();
  if (profile?.status !== "active") return null;
  const world = await primaryWorld(ctx, profile.userId);
  if (world === null || world.visibility === "hidden") return null;
  const isOwner = viewer?.userId === profile.userId;
  return {
    world: await worldView(ctx, world),
    owner: { username: profile.username, displayName: profile.displayName },
    isOwner,
    // Owner settings stay private to the owner.
    cometReview: isOwner ? world.cometReview : null,
  };
}

export async function ownedWorld(ctx: WriteCtx, worldId: Id<"worlds">): Promise<Doc<"worlds">> {
  const world = await ctx.db.get("worlds", worldId);
  if (world === null) throw appError("NOT_FOUND", "World not found");
  if (world.ownerId !== ctx.viewer.userId) throw appError("FORBIDDEN", "Not your world");
  return world;
}

export interface WorldUpdate {
  worldId: Id<"worlds">;
  name?: string;
  params?: unknown;
}

export async function updateWorld(ctx: WriteCtx, input: WorldUpdate): Promise<void> {
  const world = await ownedWorld(ctx, input.worldId);
  await enforceRateLimit(ctx, "world.update", ctx.viewer.userId);
  const extraWords = await getSetting(ctx, "moderation.extraWords");
  const patch: Partial<Pick<Doc<"worlds">, "name" | "params">> = {};
  if (input.name !== undefined) patch.name = parseWorldName(input.name, extraWords);
  if (input.params !== undefined) patch.params = parseWorldParams(input.params);
  await ctx.db.patch("worlds", world._id, { ...patch, updatedAt: Date.now() });
  ctx.log.info("world.update.succeeded", {
    worldId: world._id,
    name: patch.name !== undefined,
    params: patch.params !== undefined,
  });
}

/** An upload URL for the thumbnail. Spends a `world.update` token so uploads stay bounded. */
export async function thumbnailUploadUrl(ctx: WriteCtx, worldId: Id<"worlds">): Promise<string> {
  await ownedWorld(ctx, worldId);
  await enforceRateLimit(ctx, "world.update", ctx.viewer.userId);
  return await ctx.storage.generateUploadUrl();
}

export type ThumbnailResult = { ok: true } | { ok: false; reason: "missing" | "type" | "size" };

/**
 * Checks the uploaded file (§8.7), then swaps it in and deletes the previous one. A rejected
 * file is deleted too, so this returns instead of throwing: a throw would roll the delete back.
 */
export async function setThumbnail(
  ctx: WriteCtx,
  worldId: Id<"worlds">,
  storageId: Id<"_storage">,
): Promise<ThumbnailResult> {
  const world = await ownedWorld(ctx, worldId);
  const file = await ctx.db.system.get("_storage", storageId);
  if (file === null) return { ok: false, reason: "missing" };
  if (file.contentType !== THUMBNAIL_TYPE || file.size > THUMBNAIL_MAX_BYTES) {
    await ctx.storage.delete(storageId);
    const reason = file.contentType === THUMBNAIL_TYPE ? "size" : "type";
    ctx.log.warn("world.thumbnail.rejected", { worldId, reason, size: file.size });
    return { ok: false, reason };
  }
  const previous = world.thumbnailId;
  await ctx.db.patch("worlds", worldId, { thumbnailId: storageId });
  if (previous !== undefined && previous !== storageId) await ctx.storage.delete(previous);
  ctx.log.info("world.thumbnail.set", { worldId, size: file.size });
  return { ok: true };
}

/** "Review comets before they appear" (SPEC §2.6). */
export async function setCometReview(
  ctx: WriteCtx,
  worldId: Id<"worlds">,
  enabled: boolean,
): Promise<void> {
  const world = await ownedWorld(ctx, worldId);
  await enforceRateLimit(ctx, "world.update", ctx.viewer.userId);
  if (world.cometReview === enabled) return;
  await ctx.db.patch("worlds", worldId, { cometReview: enabled, updatedAt: Date.now() });
  ctx.log.info("world.comet_review.set", { worldId, enabled });
}
