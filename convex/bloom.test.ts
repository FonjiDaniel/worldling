import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { api, internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { enqueueBloom } from "./model/bloom";
import { createPrimaryWorld } from "./model/worlds";
import { randomParams } from "./shared/worldParams";
import { appErrorCode, makeTest, seedViewer, type TestConvex } from "./test.helpers";

// Bloom XP end to end (SPEC §2.4, §5.6): tend and visit idempotency, every daily cap, streaks,
// level-up notifications and the processor's batching.

let t: TestConvex;
const DAY_1 = Date.parse("2026-10-19T08:00:00Z");
const DAY_MS = 24 * 60 * 60 * 1000;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(DAY_1);
  t = makeTest();
});

afterEach(() => {
  vi.useRealTimers();
});

async function verifiedViewer() {
  const viewer = await seedViewer(t);
  await t.run(async (ctx) => {
    await ctx.db.patch("users", viewer.userId, { emailVerificationTime: 1 });
  });
  return viewer;
}

async function owner() {
  const viewer = await verifiedViewer();
  const worldId: Id<"worlds"> = await t.run(async (ctx) =>
    createPrimaryWorld(ctx, {
      ownerId: viewer.userId,
      name: "Mossbright",
      params: randomParams(3),
    }),
  );
  return { ...viewer, worldId };
}

const process = () => t.mutation(internal.jobs.bloom.bloomProcessor, {});
const bloomOf = (worldId: Id<"worlds">) =>
  t.run(async (ctx) => (await ctx.db.get("worlds", worldId))?.bloom);
const queued = () => t.run(async (ctx) => (await ctx.db.query("bloomQueue").take(1000)).length);
const statsOf = (worldId: Id<"worlds">, day = "2026-10-19") =>
  t.run(async (ctx) =>
    ctx.db
      .query("worldStatsDaily")
      .withIndex("by_world_day", (q) => q.eq("worldId", worldId).eq("day", day))
      .unique(),
  );

async function enqueue(
  worldId: Id<"worlds">,
  kind: Doc<"bloomQueue">["kind"],
  actors: (Id<"users"> | undefined)[],
) {
  await t.run(async (ctx) => {
    for (const actorId of actors) {
      await enqueueBloom(ctx, { worldId, kind, day: "2026-10-19", ...(actorId && { actorId }) });
    }
  });
}

async function users(count: number): Promise<Id<"users">[]> {
  return await t.run(async (ctx) =>
    Promise.all(Array.from({ length: count }, () => ctx.db.insert("users", {}))),
  );
}

describe("worlds.tend", () => {
  it("counts once per UTC day", async () => {
    const { client, worldId } = await owner();
    expect(await client.mutation(api.worlds.tend, { worldId })).toEqual({ tended: true });
    expect(await client.mutation(api.worlds.tend, { worldId })).toEqual({ tended: false });
    expect(await queued()).toBe(1);
    await process();
    expect(await bloomOf(worldId)).toEqual({
      xp: 10,
      level: 1,
      streak: 1,
      lastTendedDay: "2026-10-19",
    });
  });

  it("is only for the owner", async () => {
    const { worldId } = await owner();
    const { client } = await verifiedViewer();
    await expect(client.mutation(api.worlds.tend, { worldId })).rejects.toMatchObject(
      appErrorCode("FORBIDDEN"),
    );
  });

  it("grows a streak bonus up to +5, and a gap resets only the bonus", async () => {
    const { client, worldId } = await owner();
    for (let day = 0; day < 8; day += 1) {
      vi.setSystemTime(DAY_1 + day * DAY_MS);
      await client.mutation(api.worlds.tend, { worldId });
      await process();
    }
    // 8 tends at +10, bonuses 0, 1, 2, 3, 4, 5, 5, 5.
    expect(await bloomOf(worldId)).toMatchObject({ xp: 105, streak: 8 });
    vi.setSystemTime(DAY_1 + 9 * DAY_MS);
    await client.mutation(api.worlds.tend, { worldId });
    await process();
    expect(await bloomOf(worldId)).toMatchObject({ xp: 115, streak: 1 });
  });
});

describe("worlds.recordVisit", () => {
  it("counts a visitor once per day", async () => {
    const { worldId } = await owner();
    const { client } = await verifiedViewer();
    expect(await client.mutation(api.worlds.recordVisit, { worldId })).toEqual({ counted: true });
    expect(await client.mutation(api.worlds.recordVisit, { worldId })).toEqual({
      counted: false,
      reason: "already",
    });
    expect(await queued()).toBe(1);
  });

  it("skips the owner, unverified visitors and blocked visitors", async () => {
    const world = await owner();
    const unverified = await seedViewer(t);
    const blocked = await verifiedViewer();
    await t.run(async (ctx) => {
      await ctx.db.insert("blocks", { blockerId: world.userId, blockedId: blocked.userId });
    });
    const visit = (client: typeof world.client) =>
      client.mutation(api.worlds.recordVisit, { worldId: world.worldId });
    expect(await visit(world.client)).toEqual({ counted: false, reason: "owner" });
    expect(await visit(unverified.client)).toEqual({ counted: false, reason: "unverified" });
    expect(await visit(blocked.client)).toEqual({ counted: false, reason: "blocked" });
    expect(await queued()).toBe(0);
  });

  it("caps visit XP at 20 visitors a day", async () => {
    const { worldId } = await owner();
    for (let i = 0; i < 25; i += 1) {
      const { client } = await verifiedViewer();
      await client.mutation(api.worlds.recordVisit, { worldId });
    }
    await process();
    expect(await bloomOf(worldId)).toMatchObject({ xp: 40 });
    expect(await statsOf(worldId)).toMatchObject({ visits: 25, xpGained: 40 });
  });

  it("needs a signed-in visitor", async () => {
    const { worldId } = await owner();
    await expect(t.mutation(api.worlds.recordVisit, { worldId })).rejects.toMatchObject(
      appErrorCode("UNAUTHENTICATED"),
    );
  });
});

describe("jobs.bloomProcessor caps", () => {
  it("counts one comet per author, 10 authors a day, across batches", async () => {
    const { worldId } = await owner();
    const authors = await users(12);
    const [first] = authors;
    await enqueue(worldId, "comet_received", [...authors.slice(0, 6), first]);
    await process();
    expect(await bloomOf(worldId)).toMatchObject({ xp: 30 });
    await enqueue(worldId, "comet_received", [first, ...authors.slice(6)]);
    await process();
    expect(await bloomOf(worldId)).toMatchObject({ xp: 50 });
    const stats = await statsOf(worldId);
    expect(stats).toMatchObject({ cometsReceived: 14, xpGained: 50 });
    expect(stats?.cometAuthors).toHaveLength(10);
  });

  it("caps comets sent at 5 XP a day", async () => {
    const { userId, worldId } = await owner();
    await enqueue(
      worldId,
      "comet_sent",
      Array.from({ length: 7 }, () => userId),
    );
    await process();
    expect(await bloomOf(worldId)).toMatchObject({ xp: 5 });
    expect(await statsOf(worldId)).toMatchObject({ cometsSent: 7 });
  });

  it("writes one level-up notification when a level is reached", async () => {
    const { userId, client, worldId } = await owner();
    await enqueue(worldId, "comet_received", await users(8));
    await client.mutation(api.worlds.tend, { worldId });
    await process();
    await process();
    expect(await bloomOf(worldId)).toMatchObject({ xp: 50, level: 2 });
    const notes = await t.run(async (ctx) =>
      ctx.db
        .query("notifications")
        .withIndex("by_user_read", (q) => q.eq("userId", userId))
        .take(10),
    );
    expect(notes).toEqual([
      expect.objectContaining({ type: "level_up", data: { worldId, level: 2 } }),
    ]);
  });

  it("drops rows for hidden worlds", async () => {
    const { worldId } = await owner();
    await t.run(async (ctx) => ctx.db.patch("worlds", worldId, { visibility: "hidden" }));
    await enqueue(worldId, "comet_sent", [undefined]);
    await process();
    expect(await queued()).toBe(0);
    expect(await bloomOf(worldId)).toMatchObject({ xp: 0 });
  });

  it("reschedules itself after a full batch and records each run", async () => {
    vi.useFakeTimers({ now: DAY_1 });
    const { worldId } = await owner();
    await enqueue(
      worldId,
      "comet_sent",
      Array.from({ length: 501 }, () => undefined),
    );
    expect(await process()).toBe(500);
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    expect(await queued()).toBe(0);
    const runs = await t.run(async (ctx) =>
      ctx.db
        .query("jobRuns")
        .withIndex("by_job", (q) => q.eq("job", "jobs.bloomProcessor"))
        .take(10),
    );
    expect(runs.map((run) => run.processed)).toEqual([500, 1]);
  });
});

describe("worlds owner settings", () => {
  it("lets only the owner set comet review, and keeps it private", async () => {
    const { userId, client, worldId } = await owner();
    const other = await verifiedViewer();
    await expect(
      other.client.mutation(api.worlds.setCometReview, { worldId, enabled: true }),
    ).rejects.toMatchObject(appErrorCode("FORBIDDEN"));
    await client.mutation(api.worlds.setCometReview, { worldId, enabled: true });
    const username = await t.run(
      async (ctx) =>
        (
          await ctx.db
            .query("profiles")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .unique()
        )?.username ?? "",
    );
    expect((await client.query(api.worlds.getByUsername, { username }))?.cometReview).toBe(true);
    expect((await t.query(api.worlds.getByUsername, { username }))?.cometReview).toBeNull();
  });
});

describe("comets.listForWorld", () => {
  it("shows visible comets to everyone and pending ones to the owner only", async () => {
    const { client, worldId } = await owner();
    const author = await verifiedViewer();
    await t.run(async (ctx) => {
      for (const status of ["visible", "pending", "hidden"] as const) {
        await ctx.db.insert("comets", {
          worldId,
          authorId: author.userId,
          body: `A ${status} comet`,
          status,
          reportCount: 0,
        });
      }
    });
    const page = { numItems: 10, cursor: null };
    const guest = await t.query(api.comets.listForWorld, { worldId, paginationOpts: page });
    expect(guest.page.map((c) => c.body)).toEqual(["A visible comet"]);
    expect(guest.page[0]?.author).toMatchObject({ displayName: "user" });
    await expect(
      t.query(api.comets.listForWorld, { worldId, status: "pending", paginationOpts: page }),
    ).rejects.toMatchObject(appErrorCode("FORBIDDEN"));
    const pending = await client.query(api.comets.listForWorld, {
      worldId,
      status: "pending",
      paginationOpts: page,
    });
    expect(pending.page.map((c) => c.status)).toEqual(["pending"]);
  });
});
