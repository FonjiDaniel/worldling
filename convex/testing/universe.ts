import { v } from "convex/values";

import { internal } from "../_generated/api";
import { internalMutation } from "../_generated/server";
import { syncWorldPin } from "../model/pins";
import { refreshRails } from "../model/rails";
import { createPrimaryWorld } from "../model/worlds";
import { LEVEL_XP, MAX_LEVEL } from "../shared/bloom";
import { hash01 } from "../shared/random";
import { randomParams, randomWorldName } from "../shared/worldParams";
import { assertEnabled } from "./e2e";

// Universe seed for performance testing (Phase 8, `pnpm seed:universe`). Internal and refused
// on production like the e2e helpers (ADR-016). Seeded accounts are named seed_{slot} and use
// e2e addresses, so they never receive mail and clearSeeded can find them.

const MAX_BATCH = 250;
const SEED_PREFIX = "seed_";

export const seedUniverse = internalMutation({
  args: { count: v.number(), batch: v.optional(v.number()) },
  returns: v.null(),
  handler: async (ctx, { count, batch = 200 }) => {
    assertEnabled();
    const size = Math.max(1, Math.min(MAX_BATCH, batch, count));
    for (let i = 0; i < size; i += 1) {
      // The slot createPrimaryWorld is about to take, so the username matches it.
      const slot = (await ctx.db.query("galaxy").first())?.nextSlot ?? 0;
      const userId = await ctx.db.insert("users", {
        email: `seed-${String(slot)}@e2e.worldling.test`,
      });
      await ctx.db.insert("profiles", {
        userId,
        username: `${SEED_PREFIX}${String(slot)}`,
        displayName: `Seed ${String(slot)}`,
        role: "user",
        status: "active",
        emailPrefs: { cometAlerts: false, weeklyDigest: false, productUpdates: false },
      });
      const seed = Math.floor(hash01(slot) * 4294967295);
      const worldId = await createPrimaryWorld(ctx, {
        ownerId: userId,
        name: randomWorldName(seed),
        params: randomParams(seed),
      });
      const level = 1 + Math.floor(hash01(seed) * MAX_LEVEL);
      const xp = LEVEL_XP[level - 1] ?? 0;
      await ctx.db.patch("worlds", worldId, { bloom: { xp, level, streak: 0 } });
      await syncWorldPin(ctx, worldId);
    }
    const remaining = count - size;
    if (remaining > 0) {
      await ctx.scheduler.runAfter(0, internal.testing.universe.seedUniverse, {
        count: remaining,
        batch,
      });
    } else {
      await refreshRails(ctx);
    }
    return null;
  },
});

/** Deletes seeded accounts and their worlds in batches. Slots stay taken (never reused). */
export const clearSeeded = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    assertEnabled();
    const pins = await ctx.db
      .query("worldPins")
      .withIndex("by_username", (q) =>
        q.gte("username", SEED_PREFIX).lt("username", `${SEED_PREFIX}~`),
      )
      .take(MAX_BATCH);
    for (const pin of pins) {
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", pin.ownerId))
        .unique();
      await ctx.db.delete("worldPins", pin._id);
      await ctx.db.delete("worlds", pin.worldId);
      if (profile !== null) await ctx.db.delete("profiles", profile._id);
      await ctx.db.delete("users", pin.ownerId);
    }
    if (pins.length === MAX_BATCH) {
      await ctx.scheduler.runAfter(0, internal.testing.universe.clearSeeded, {});
    } else {
      await refreshRails(ctx);
    }
    return null;
  },
});
