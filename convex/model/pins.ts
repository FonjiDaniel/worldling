import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { pinColors } from "../shared/pins";
import { describeWorld } from "../shared/worldDescription";

// worldPins (ADR-024): a render-ready copy of every public world with an active owner. Every
// writer that changes a world's visibility, name, params, level or thumbnail, or its owner's
// status or username, calls syncWorldPin in the same transaction.

type PinFields = Omit<Doc<"worldPins">, "_id" | "_creationTime">;

function pinFields(world: Doc<"worlds">, profile: Doc<"profiles">): PinFields {
  return {
    worldId: world._id,
    ownerId: world.ownerId,
    slot: world.slot,
    sectorKey: world.sectorKey,
    name: world.name,
    username: profile.username,
    ...pinColors(world.params),
    level: world.bloom.level,
    thumbnailId: world.thumbnailId,
    description: describeWorld(world.params, world.bloom.level),
  };
}

export async function pinForWorld(
  ctx: Pick<QueryCtx, "db">,
  worldId: Id<"worlds">,
): Promise<Doc<"worldPins"> | null> {
  return await ctx.db
    .query("worldPins")
    .withIndex("by_world", (q) => q.eq("worldId", worldId))
    .unique();
}

async function ownerProfile(ctx: Pick<QueryCtx, "db">, ownerId: Id<"users">) {
  return await ctx.db
    .query("profiles")
    .withIndex("by_userId", (q) => q.eq("userId", ownerId))
    .unique();
}

const unchanged = (pin: Doc<"worldPins">, next: PinFields): boolean =>
  (Object.keys(next) as (keyof PinFields)[]).every((key) => pin[key] === next[key]);

/** Upserts the pin when the world should be in the universe, and removes it when not. */
export async function syncWorldPin(ctx: MutationCtx, worldId: Id<"worlds">): Promise<void> {
  const pin = await pinForWorld(ctx, worldId);
  const world = await ctx.db.get("worlds", worldId);
  const profile = world === null ? null : await ownerProfile(ctx, world.ownerId);
  if (
    world === null ||
    !world.isPrimary ||
    world.visibility !== "public" ||
    profile?.status !== "active"
  ) {
    if (pin !== null) await ctx.db.delete("worldPins", pin._id);
    return;
  }
  const next = pinFields(world, profile);
  if (pin === null) await ctx.db.insert("worldPins", next);
  else if (!unchanged(pin, next)) await ctx.db.replace("worldPins", pin._id, next);
}
