import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import type { Logger } from "../lib/logger";
import { addUtcDays } from "../lib/time";
import { DAILY_CAPS, levelForXp, streakAfter, streakBonus, XP } from "../shared/bloom";

// Bloom XP (SPEC §2.4, §5.6, §5.7). Tends, visits and comets only insert into bloomQueue; the
// processor is the single writer of worlds.bloom and applies the daily caps from worldStatsDaily.

type QueueRow = Doc<"bloomQueue">;
type Bloom = Doc<"worlds">["bloom"];
type Stats = Omit<Doc<"worldStatsDaily">, "_id" | "_creationTime"> & {
  _id?: Id<"worldStatsDaily">;
};

export type BloomEntry = Omit<QueueRow, "_id" | "_creationTime">;

export async function enqueueBloom(ctx: MutationCtx, entry: BloomEntry): Promise<void> {
  await ctx.db.insert("bloomQueue", entry);
}

async function loadStats(ctx: MutationCtx, worldId: Id<"worlds">, day: string): Promise<Stats> {
  const existing = await ctx.db
    .query("worldStatsDaily")
    .withIndex("by_world_day", (q) => q.eq("worldId", worldId).eq("day", day))
    .unique();
  return existing ?? { worldId, day, visits: 0, cometsReceived: 0, cometsSent: 0, xpGained: 0 };
}

/** XP for one queue row. Mutates `stats` and `bloom` (local copies). */
function apply(row: QueueRow, stats: Stats, bloom: Bloom): number {
  switch (row.kind) {
    case "tend": {
      if (bloom.lastTendedDay !== undefined && bloom.lastTendedDay >= row.day) return 0;
      bloom.streak = streakAfter(bloom.lastTendedDay, addUtcDays(row.day, -1), bloom.streak);
      bloom.lastTendedDay = row.day;
      return XP.tend + streakBonus(bloom.streak);
    }
    case "visit": {
      stats.visits += 1;
      return stats.visits <= DAILY_CAPS.visits ? XP.visit : 0;
    }
    case "comet_received": {
      stats.cometsReceived += 1;
      const authors = stats.cometAuthors ?? [];
      const author = row.actorId;
      if (author === undefined || authors.includes(author)) return 0;
      if (authors.length >= DAILY_CAPS.cometsReceived) return 0;
      stats.cometAuthors = [...authors, author];
      return XP.cometReceived;
    }
    case "comet_sent": {
      stats.cometsSent += 1;
      return stats.cometsSent <= DAILY_CAPS.cometsSent ? XP.cometSent : 0;
    }
  }
}

async function saveStats(ctx: MutationCtx, stats: Stats): Promise<void> {
  const { _id, ...fields } = stats;
  if (_id === undefined) await ctx.db.insert("worldStatsDaily", fields);
  else await ctx.db.replace("worldStatsDaily", _id, fields);
}

/** Applies one world's rows. Returns the new level when it went up, else null. */
async function applyWorld(
  ctx: MutationCtx,
  world: Doc<"worlds">,
  rows: QueueRow[],
): Promise<number | null> {
  const bloom: Bloom = { ...world.bloom };
  const statsByDay = new Map<string, Stats>();
  let gained = 0;
  for (const row of rows) {
    const stats = statsByDay.get(row.day) ?? (await loadStats(ctx, world._id, row.day));
    statsByDay.set(row.day, stats);
    const xp = apply(row, stats, bloom);
    stats.xpGained += xp;
    gained += xp;
  }
  for (const stats of statsByDay.values()) await saveStats(ctx, stats);
  bloom.xp += gained;
  bloom.level = Math.max(world.bloom.level, levelForXp(bloom.xp));
  await ctx.db.patch("worlds", world._id, { bloom });
  if (bloom.level <= world.bloom.level) return null;
  await ctx.db.insert("notifications", {
    userId: world.ownerId,
    type: "level_up",
    data: { worldId: world._id, level: bloom.level },
  });
  return bloom.level;
}

export interface BatchResult {
  processed: number;
  worlds: number;
  levelUps: number;
}

/** Groups rows by world, applies caps, writes stats, bloom and level-up notifications. */
export async function applyBloomBatch(
  ctx: MutationCtx & { log: Logger },
  rows: QueueRow[],
): Promise<BatchResult> {
  const byWorld = new Map<Id<"worlds">, QueueRow[]>();
  for (const row of rows) byWorld.set(row.worldId, [...(byWorld.get(row.worldId) ?? []), row]);
  let levelUps = 0;
  for (const [worldId, worldRows] of byWorld) {
    const world = await ctx.db.get("worlds", worldId);
    if (world?.visibility !== "public") {
      ctx.log.info("bloom.world.skipped", { worldId, rows: worldRows.length });
      continue;
    }
    const level = await applyWorld(ctx, world, worldRows);
    if (level !== null) {
      levelUps += 1;
      ctx.log.info("bloom.level.up", { worldId, level });
    }
  }
  for (const row of rows) await ctx.db.delete("bloomQueue", row._id);
  return { processed: rows.length, worlds: byWorld.size, levelUps };
}
