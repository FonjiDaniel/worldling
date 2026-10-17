import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { sectorKeyForSlot } from "../shared/galaxy";
import type { WorldParams } from "../shared/worldParams";

// Worlds (SPEC §5.2, §5.7). Phase 4 creates the primary world at onboarding; Phase 6 adds
// editing and Phase 8 the universe queries.

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
