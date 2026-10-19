import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { enqueueBloom } from "./model/bloom";
import { pinForWorld, syncWorldPin } from "./model/pins";
import { createPrimaryWorld } from "./model/worlds";
import { pinColors } from "./shared/pins";
import { randomParams } from "./shared/worldParams";
import { makeTest, seedViewer, type TestConvex } from "./test.helpers";

// The universe (SPEC §2.5, §5.5, ADR-024): worldPins stay in sync with every writer, and the
// queries only ever show public worlds of active owners.

let t: TestConvex;

beforeEach(() => {
  t = makeTest();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

async function owner(name = "Mossbright", seed = 7) {
  const viewer = await seedViewer(t);
  const worldId: Id<"worlds"> = await t.run(async (ctx) =>
    createPrimaryWorld(ctx, { ownerId: viewer.userId, name, params: randomParams(seed) }),
  );
  const username = await t.run(
    async (ctx) =>
      (
        await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q) => q.eq("userId", viewer.userId))
          .unique()
      )?.username ?? "",
  );
  return { ...viewer, worldId, username };
}

const pinOf = (worldId: Id<"worlds">) => t.run(async (ctx) => pinForWorld(ctx, worldId));
const sectorOf = (worldId: Id<"worlds">) =>
  t.run(async (ctx) => (await ctx.db.get("worlds", worldId))?.sectorKey ?? "");

describe("worldPins sync", () => {
  it("creates a pin with the world's colors and description", async () => {
    const { worldId, username } = await owner();
    const pin = await pinOf(worldId);
    expect(pin).toMatchObject({ name: "Mossbright", username, level: 1, slot: 0 });
    expect(pin).toMatchObject(pinColors(randomParams(7)));
    expect(pin?.description).toMatch(/world with/);
  });

  it("follows renames and thumbnails", async () => {
    const { client, worldId } = await owner();
    await client.mutation(api.worlds.update, { worldId, name: "Tidewell" });
    expect(await pinOf(worldId)).toMatchObject({ name: "Tidewell" });

    // convex-test drops the content type, so it is written onto the system row (as in worlds.test).
    const storageId = await t.run(async (ctx) => {
      const id = await ctx.storage.store(new Blob(["x"], { type: "image/webp" }));
      const db = ctx.db as unknown as { patch: (id: string, fields: object) => Promise<void> };
      await db.patch(id, { contentType: "image/webp" });
      return id;
    });
    await client.mutation(api.worlds.setThumbnail, { worldId, storageId });
    expect(await pinOf(worldId)).toMatchObject({ thumbnailId: storageId });
  });

  it("updates on a level up and leaves XP-only changes alone", async () => {
    const { worldId } = await owner();
    const before = await pinOf(worldId);
    await t.run(async (ctx) => {
      await enqueueBloom(ctx, { worldId, kind: "tend", day: "2026-10-19" });
    });
    await t.mutation(internal.jobs.bloom.bloomProcessor, {});
    expect(await pinOf(worldId)).toEqual(before);

    await t.run(async (ctx) => {
      await ctx.db.patch("worlds", worldId, { bloom: { xp: 45, level: 1, streak: 0 } });
      await enqueueBloom(ctx, { worldId, kind: "tend", day: "2026-10-20" });
    });
    await t.mutation(internal.jobs.bloom.bloomProcessor, {});
    expect(await pinOf(worldId)).toMatchObject({ level: 2 });
  });

  it("drops hidden worlds and inactive owners", async () => {
    const hidden = await owner("Hidden", 1);
    const suspended = await owner("Quiet", 2);
    await t.run(async (ctx) => {
      await ctx.db.patch("worlds", hidden.worldId, { visibility: "hidden" });
      await syncWorldPin(ctx, hidden.worldId);
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", suspended.userId))
        .unique();
      if (profile) await ctx.db.patch("profiles", profile._id, { status: "suspended" });
      await syncWorldPin(ctx, suspended.worldId);
    });
    expect(await pinOf(hidden.worldId)).toBeNull();
    expect(await pinOf(suspended.worldId)).toBeNull();
    const keys = [await sectorOf(hidden.worldId), await sectorOf(suspended.worldId)];
    expect(await t.query(api.universe.sectors, { keys })).toEqual([]);
    const ids = [hidden.worldId, suspended.worldId];
    expect(await t.query(api.universe.renderable, { ids })).toEqual([]);
  });
});

describe("universe queries", () => {
  it("returns lean pins per sector and skips bad or repeated keys", async () => {
    const { worldId } = await owner();
    const key = await sectorOf(worldId);
    const pins = await t.query(api.universe.sectors, { keys: [key, key, "nope", "1:2:3"] });
    expect(pins).toHaveLength(1);
    expect(Object.keys(pins[0] ?? {}).sort()).toEqual(
      ["colorA", "colorB", "id", "level", "name", "slot", "username"].sort(),
    );
  });

  it("reads at most 9 sectors", async () => {
    const { worldId } = await owner();
    const key = await sectorOf(worldId);
    const filler = Array.from({ length: 9 }, (_, i) => `${String(100 + i)}:0`);
    expect(await t.query(api.universe.sectors, { keys: [...filler, key] })).toEqual([]);
  });

  it("sends full params for at most 12 worlds", async () => {
    const worlds = [];
    for (let i = 0; i < 13; i += 1) worlds.push(await owner(`World ${String(i)}`, i + 1));
    const ids = worlds.map((world) => world.worldId);
    const result = await t.query(api.universe.renderable, { ids });
    expect(result).toHaveLength(12);
    expect(result[0]).toMatchObject({ id: ids[0], level: 1, params: randomParams(1) });
  });

  it("counts slots and reads the live flag", async () => {
    await owner();
    await owner("Second", 2);
    expect(await t.query(api.universe.overview, {})).toEqual({ slotCount: 2, live: true });
  });

  it("searches by username prefix", async () => {
    const { username } = await owner();
    const prefix = username.slice(0, 6);
    const found = await t.query(api.universe.search, { q: ` @${prefix.toUpperCase()} ` });
    expect(found.map((pin) => pin.username)).toEqual([username]);
    expect(found[0]?.thumbUrl).toBeNull();
    expect(await t.query(api.universe.search, { q: "zzz" })).toEqual([]);
    expect(await t.query(api.universe.search, { q: "@!" })).toEqual([]);
  });

  it("lists every world newest first", async () => {
    await owner("First", 1);
    await owner("Second", 2);
    await owner("Third", 3);
    const page = await t.query(api.universe.list, {
      paginationOpts: { numItems: 2, cursor: null },
    });
    expect(page.page.map((pin) => pin.name)).toEqual(["Third", "Second"]);
    expect(page.isDone).toBe(false);
    const next = await t.query(api.universe.list, {
      paginationOpts: { numItems: 2, cursor: page.continueCursor },
    });
    expect(next.page.map((pin) => pin.name)).toEqual(["First"]);
  });
});

describe("jobs.rollups.trending", () => {
  it("writes the just born and featured rails", async () => {
    const first = await owner("First", 1);
    const second = await owner("Second", 2);
    const hidden = await owner("Hidden", 3);
    await t.run(async (ctx) => {
      await ctx.db.patch("worlds", first.worldId, { featuredAt: 10 });
      await ctx.db.patch("worlds", hidden.worldId, { featuredAt: 20, visibility: "hidden" });
      await syncWorldPin(ctx, hidden.worldId);
    });
    expect(await t.query(api.universe.justBorn, {})).toEqual([]);

    await t.mutation(internal.jobs.rollups.trending, {});
    const justBorn = await t.query(api.universe.justBorn, {});
    expect(justBorn.map((pin) => pin.id)).toEqual([second.worldId, first.worldId]);
    const featured = await t.query(api.universe.featured, {});
    expect(featured.map((pin) => pin.id)).toEqual([first.worldId]);
    const runs = await t.run(async (ctx) =>
      ctx.db
        .query("jobRuns")
        .withIndex("by_job", (q) => q.eq("job", "jobs.rollups.trending"))
        .take(5),
    );
    expect(runs).toHaveLength(1);
  });
});

describe("testing/universe seed", () => {
  it("seeds worlds with pins on a test deployment", async () => {
    vi.stubEnv("APP_ENV", "test");
    await t.mutation(internal.testing.universe.seedUniverse, { count: 3 });
    const pins = await t.run(async (ctx) => ctx.db.query("worldPins").take(10));
    expect(pins.map((pin) => pin.username).sort()).toEqual(["seed_0", "seed_1", "seed_2"]);
    expect(pins.map((pin) => pin.slot).sort()).toEqual([0, 1, 2]);

    await t.mutation(internal.testing.universe.clearSeeded, {});
    expect(await t.run(async (ctx) => ctx.db.query("worldPins").take(10))).toEqual([]);
    expect(await t.run(async (ctx) => ctx.db.query("worlds").take(10))).toEqual([]);
  });

  it("refuses to run on production", async () => {
    vi.stubEnv("APP_ENV", "production");
    await expect(t.mutation(internal.testing.universe.seedUniverse, { count: 1 })).rejects.toThrow(
      /off on this deployment/,
    );
    await expect(t.mutation(internal.testing.universe.clearSeeded, {})).rejects.toThrow(
      /off on this deployment/,
    );
  });
});
