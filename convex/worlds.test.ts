import { beforeEach, describe, expect, it } from "vitest";

import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { createPrimaryWorld } from "./model/worlds";
import {
  appErrorCode,
  makeTest,
  seedViewer,
  setMaintenance,
  type TestConvex,
} from "./test.helpers";
import { randomParams, THUMBNAIL_MAX_BYTES } from "./shared/worldParams";

let t: TestConvex;

beforeEach(() => {
  t = makeTest();
});

async function owner(options: Parameters<typeof seedViewer>[1] = {}) {
  const viewer = await seedViewer(t, options);
  const worldId: Id<"worlds"> = await t.run(async (ctx) =>
    createPrimaryWorld(ctx, {
      ownerId: viewer.userId,
      name: "Mossbright",
      params: randomParams(7),
    }),
  );
  return { ...viewer, worldId };
}

async function usernameOf(userId: Id<"users">): Promise<string> {
  return await t.run(async (ctx) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (profile === null) throw new Error("missing profile");
    return profile.username;
  });
}

/** Stores a file. convex-test drops the content type, so it is written onto the system row. */
const store = (bytes: number, type: string) =>
  t.run(async (ctx) => {
    const storageId = await ctx.storage.store(new Blob([new Uint8Array(bytes)], { type }));
    const db = ctx.db as unknown as { patch: (id: string, fields: object) => Promise<void> };
    await db.patch(storageId, { contentType: type });
    return storageId;
  });

const getWorld = (worldId: Id<"worlds">) => t.run(async (ctx) => ctx.db.get(worldId));

describe("worlds.mine", () => {
  it("returns the viewer's primary world", async () => {
    const { client, worldId } = await owner();
    expect(await client.query(api.worlds.mine, {})).toMatchObject({
      _id: worldId,
      name: "Mossbright",
      level: 1,
      thumbnailUrl: null,
    });
  });

  it("requires sign in", async () => {
    await expect(t.query(api.worlds.mine, {})).rejects.toMatchObject(
      appErrorCode("UNAUTHENTICATED"),
    );
  });
});

describe("worlds.getByUsername", () => {
  it("shows a public world and knows its owner", async () => {
    const { userId, client, worldId } = await owner();
    const username = await usernameOf(userId);
    const asGuest = await t.query(api.worlds.getByUsername, { username: username.toUpperCase() });
    expect(asGuest).toMatchObject({ world: { _id: worldId }, owner: { username }, isOwner: false });
    expect((await client.query(api.worlds.getByUsername, { username }))?.isOwner).toBe(true);
  });

  it("hides hidden worlds, suspended owners and unknown names", async () => {
    const { userId, worldId } = await owner();
    const username = await usernameOf(userId);
    await t.run(async (ctx) => ctx.db.patch(worldId, { visibility: "hidden" }));
    expect(await t.query(api.worlds.getByUsername, { username })).toBeNull();

    const suspended = await owner({ role: "moderator", status: "suspended" });
    const other = await usernameOf(suspended.userId);
    expect(await t.query(api.worlds.getByUsername, { username: other })).toBeNull();
    expect(await t.query(api.worlds.getByUsername, { username: "nobody_here" })).toBeNull();
  });
});

describe("worlds.update", () => {
  it("saves a new name and clamped params", async () => {
    const { client, worldId } = await owner();
    const params = randomParams(9);
    await client.mutation(api.worlds.update, {
      worldId,
      name: "  Tide  haven ",
      params: { ...params, terrain: { ...params.terrain, amplitude: 9 } },
    });
    expect(await getWorld(worldId)).toMatchObject({
      name: "Tide haven",
      params: { seed: 9, terrain: { amplitude: 0.25 } },
    });
  });

  it("refuses unkind and empty names", async () => {
    const { client, worldId } = await owner();
    for (const name of ["shit world", "   "]) {
      await expect(client.mutation(api.worlds.update, { worldId, name })).rejects.toMatchObject(
        appErrorCode("VALIDATION"),
      );
    }
  });

  it("only lets the owner edit", async () => {
    const { worldId } = await owner();
    const stranger = await seedViewer(t, { role: "moderator" });
    await expect(
      stranger.client.mutation(api.worlds.update, { worldId, name: "Mine now" }),
    ).rejects.toMatchObject(appErrorCode("FORBIDDEN"));
  });

  it("is rate limited to 20 a minute", async () => {
    const { client, worldId } = await owner();
    for (let i = 0; i < 20; i += 1) {
      await client.mutation(api.worlds.update, { worldId, name: `Vale ${String(i)}` });
    }
    await expect(
      client.mutation(api.worlds.update, { worldId, name: "One more" }),
    ).rejects.toMatchObject(appErrorCode("RATE_LIMITED"));
  });

  it("is closed during maintenance", async () => {
    const { client, worldId } = await owner();
    await setMaintenance(t, true);
    await expect(
      client.mutation(api.worlds.update, { worldId, name: "Quiet" }),
    ).rejects.toMatchObject(appErrorCode("MAINTENANCE"));
  });
});

describe("worlds thumbnails", () => {
  it("hands the owner an upload URL", async () => {
    const { client, worldId } = await owner();
    expect(await client.mutation(api.worlds.generateThumbnailUploadUrl, { worldId })).toMatch(
      /^https?:/,
    );
    const stranger = await seedViewer(t, { role: "moderator" });
    await expect(
      stranger.client.mutation(api.worlds.generateThumbnailUploadUrl, { worldId }),
    ).rejects.toMatchObject(appErrorCode("FORBIDDEN"));
  });

  it("accepts a WebP and deletes the previous file", async () => {
    const { client, worldId } = await owner();
    const first = await store(1000, "image/webp");
    const second = await store(2000, "image/webp");
    expect(await client.mutation(api.worlds.setThumbnail, { worldId, storageId: first })).toEqual({
      ok: true,
    });
    await client.mutation(api.worlds.setThumbnail, { worldId, storageId: second });
    expect((await getWorld(worldId))?.thumbnailId).toBe(second);
    expect(await t.run(async (ctx) => ctx.db.system.get("_storage", first))).toBeNull();
    expect((await client.query(api.worlds.mine, {}))?.thumbnailUrl).toEqual(expect.any(String));
  });

  it.each([
    ["type", 1000, "image/png"],
    ["size", THUMBNAIL_MAX_BYTES + 1, "image/webp"],
  ] as const)("rejects and deletes a file with the wrong %s", async (reason, bytes, type) => {
    const { client, worldId } = await owner();
    const storageId = await store(bytes, type);
    expect(await client.mutation(api.worlds.setThumbnail, { worldId, storageId })).toEqual({
      ok: false,
      reason,
    });
    expect(await t.run(async (ctx) => ctx.db.system.get("_storage", storageId))).toBeNull();
    expect((await getWorld(worldId))?.thumbnailId).toBeUndefined();
  });

  it("reports a missing file and refuses other owners", async () => {
    const { client, worldId } = await owner();
    const storageId = await store(10, "image/webp");
    await t.run(async (ctx) => ctx.storage.delete(storageId));
    expect(await client.mutation(api.worlds.setThumbnail, { worldId, storageId })).toEqual({
      ok: false,
      reason: "missing",
    });
    const stranger = await seedViewer(t, { role: "moderator" });
    const theirs = await store(10, "image/webp");
    await expect(
      stranger.client.mutation(api.worlds.setThumbnail, { worldId, storageId: theirs }),
    ).rejects.toMatchObject(appErrorCode("FORBIDDEN"));
  });
});
