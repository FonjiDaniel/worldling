import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import {
  appErrorCode,
  makeTest,
  seedViewer,
  setMaintenance,
  type TestConvex,
} from "./test.helpers";
import { stubEmailEnv } from "./test.helpers";
import { randomParams } from "./shared/worldParams";

let t: TestConvex;

beforeEach(() => {
  stubEmailEnv();
  vi.stubEnv("SITE_URL", "https://worldling.test");
  t = makeTest();
});

async function newUser(options: { verified?: boolean; email?: string } = {}) {
  const { verified = true, email = "kai@worldling.test" } = options;
  const userId: Id<"users"> = await t.run(async (ctx) =>
    ctx.db.insert("users", { email, ...(verified && { emailVerificationTime: 1 }) }),
  );
  return { userId, client: t.withIdentity({ subject: `${userId}|session` }) };
}

const onboard = { username: "Dawn_Light", displayName: "  Kai  " };

describe("profiles.me", () => {
  it("is null when signed out", async () => {
    expect(await t.query(api.profiles.me, {})).toBeNull();
  });

  it("asks a new user to onboard", async () => {
    const { client } = await newUser();
    expect(await client.query(api.profiles.me, {})).toEqual({
      needsOnboarding: true,
      emailVerified: true,
      profile: null,
    });
  });

  it("shows a suspended viewer their reason", async () => {
    const { userId, client } = await seedViewer(t, { status: "suspended" });
    await t.run(async (ctx) => {
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .unique();
      if (profile === null) throw new Error("missing profile");
      await ctx.db.patch(profile._id, { suspension: { reason: "Spam", byUserId: userId, at: 1 } });
    });
    const me = await client.query(api.profiles.me, {});
    expect(me?.profile).toMatchObject({ status: "suspended", suspensionReason: "Spam" });
  });

  it("counts a Google account as verified", async () => {
    const { userId, client } = await newUser({ verified: false });
    await t.run(async (ctx) => {
      await ctx.db.insert("authAccounts", { userId, provider: "google", providerAccountId: "g-1" });
    });
    expect((await client.query(api.profiles.me, {}))?.emailVerified).toBe(true);
  });
});

describe("profiles.isUsernameAvailable", () => {
  it("explains why a name is not available", async () => {
    await seedViewer(t);
    const check = (username: string) => t.query(api.profiles.isUsernameAvailable, { username });
    expect(await check("dawn_light")).toEqual({ available: true });
    expect(await check("no")).toEqual({ available: false, reason: "format" });
    expect(await check("admin")).toEqual({ available: false, reason: "reserved" });
    expect(await check("shit_world")).toEqual({ available: false, reason: "moderation" });
  });

  it("knows taken and admin-reserved names", async () => {
    const { client } = await newUser();
    await client.mutation(api.profiles.completeOnboarding, onboard);
    await t.run(async (ctx) => {
      await ctx.db.insert("settings", {
        key: "usernames.reserved",
        value: ["comet"],
        updatedAt: 0,
      });
    });
    const check = (username: string) => t.query(api.profiles.isUsernameAvailable, { username });
    expect(await check("DAWN_LIGHT")).toEqual({ available: false, reason: "taken" });
    expect(await check("comet")).toEqual({ available: false, reason: "reserved" });
  });
});

describe("profiles.completeOnboarding", () => {
  it("creates the profile, a world in slot 0 and a welcome email", async () => {
    const { userId, client } = await newUser();
    const result = await client.mutation(api.profiles.completeOnboarding, onboard);
    expect(result.username).toBe("dawn_light");

    const state = await t.run(async (ctx) => ({
      profile: await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .unique(),
      world: await ctx.db.get(result.worldId),
      galaxy: await ctx.db.query("galaxy").first(),
      outbox: await ctx.db.query("emailOutbox").collect(),
    }));
    expect(state.profile).toMatchObject({ displayName: "Kai", role: "user", status: "active" });
    expect(state.world).toMatchObject({
      ownerId: userId,
      isPrimary: true,
      slot: 0,
      visibility: "public",
    });
    expect(state.world?.sectorKey).toMatch(/^-?\d+:-?\d+$/);
    expect(state.galaxy?.nextSlot).toBe(1);
    expect(state.outbox).toHaveLength(1);
    expect(state.outbox[0]).toMatchObject({
      template: "account.welcome",
      to: "kai@worldling.test",
      idempotencyKey: `account.welcome:${userId}`,
    });
    expect(state.outbox[0]?.data).toMatchObject({
      worldUrl: "https://worldling.test/w/dawn_light",
    });
  });

  it("gives each new world the next slot", async () => {
    const first = await newUser({ email: "a@worldling.test" });
    const second = await newUser({ email: "b@worldling.test" });
    await first.client.mutation(api.profiles.completeOnboarding, { ...onboard, username: "first" });
    const { worldId } = await second.client.mutation(api.profiles.completeOnboarding, {
      ...onboard,
      username: "second",
    });
    expect((await t.run(async (ctx) => ctx.db.get(worldId)))?.slot).toBe(1);
  });

  it("claims a valid draft, clamping its numbers", async () => {
    const { client } = await newUser();
    const params = randomParams(7);
    const { worldId } = await client.mutation(api.profiles.completeOnboarding, {
      ...onboard,
      draft: {
        name: " Mossbright ",
        params: { ...params, terrain: { ...params.terrain, scale: 50 } },
      },
    });
    const world = await t.run(async (ctx) => ctx.db.get(worldId));
    expect(world).toMatchObject({ name: "Mossbright", params: { seed: 7, terrain: { scale: 3 } } });
  });

  it("refuses an unkind draft name", async () => {
    const { client } = await newUser();
    await expect(
      client.mutation(api.profiles.completeOnboarding, {
        ...onboard,
        draft: { name: "shit world", params: randomParams(7) },
      }),
    ).rejects.toMatchObject(appErrorCode("VALIDATION"));
  });

  it.each([
    [{ username: "admin" }, "reserved"],
    [{ username: "x" }, "format"],
    [{ username: "fuck_off" }, "moderation"],
  ])("refuses username %j (%s)", async (override, problem) => {
    const { client } = await newUser();
    await expect(
      client.mutation(api.profiles.completeOnboarding, { ...onboard, ...override }),
    ).rejects.toMatchObject({
      data: expect.objectContaining({
        code: "VALIDATION",
        details: { fieldErrors: { username: [problem] } },
      }) as unknown,
    });
  });

  it("refuses a bad display name", async () => {
    const { client } = await newUser();
    await expect(
      client.mutation(api.profiles.completeOnboarding, { ...onboard, displayName: "  " }),
    ).rejects.toMatchObject(appErrorCode("VALIDATION"));
  });

  it("refuses a taken username", async () => {
    const first = await newUser({ email: "a@worldling.test" });
    const second = await newUser({ email: "b@worldling.test" });
    await first.client.mutation(api.profiles.completeOnboarding, onboard);
    await expect(
      second.client.mutation(api.profiles.completeOnboarding, onboard),
    ).rejects.toMatchObject(appErrorCode("CONFLICT"));
  });

  it("refuses unverified, already onboarded, signed out and maintenance", async () => {
    const unverified = await newUser({ verified: false });
    await expect(
      unverified.client.mutation(api.profiles.completeOnboarding, onboard),
    ).rejects.toMatchObject(appErrorCode("PRECONDITION"));

    const { client } = await seedViewer(t);
    await expect(client.mutation(api.profiles.completeOnboarding, onboard)).rejects.toMatchObject(
      appErrorCode("CONFLICT"),
    );

    await expect(t.mutation(api.profiles.completeOnboarding, onboard)).rejects.toMatchObject(
      appErrorCode("UNAUTHENTICATED"),
    );

    const fresh = await newUser({ email: "c@worldling.test" });
    await setMaintenance(t, true);
    await expect(
      fresh.client.mutation(api.profiles.completeOnboarding, onboard),
    ).rejects.toMatchObject(appErrorCode("MAINTENANCE"));
  });
});
