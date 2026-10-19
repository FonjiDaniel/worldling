import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { setSystemSetting } from "../lib/settings";
import { RAIL_SIZE } from "../shared/pins";

// The featured and just born rails (SPEC §2.5, §5.6, ADR-024).

/** Featured worlds are staff picks (featuredAt, Phase 10), newest pick first. */
async function featuredIds(ctx: MutationCtx): Promise<Id<"worlds">[]> {
  const worlds = await ctx.db
    .query("worlds")
    .withIndex("by_featured", (q) => q.gt("featuredAt", 0))
    .order("desc")
    .take(RAIL_SIZE * 2);
  const ids: Id<"worlds">[] = [];
  for (const world of worlds) {
    if (ids.length === RAIL_SIZE) break;
    const pin = await ctx.db
      .query("worldPins")
      .withIndex("by_world", (q) => q.eq("worldId", world._id))
      .unique();
    if (pin !== null) ids.push(world._id);
  }
  return ids;
}

export async function refreshRails(
  ctx: MutationCtx,
): Promise<{ featured: number; justBorn: number }> {
  const newest = await ctx.db.query("worldPins").withIndex("by_slot").order("desc").take(RAIL_SIZE);
  const justBorn = newest.map((pin) => pin.worldId);
  const featured = await featuredIds(ctx);
  await setSystemSetting(ctx, "universe.justBorn", justBorn);
  await setSystemSetting(ctx, "universe.featured", featured);
  return { featured: featured.length, justBorn: justBorn.length };
}
