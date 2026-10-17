import { beforeEach, describe, expect, it } from "vitest";

import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { appErrorCode, makeTest, type TestConvex } from "../test.helpers";

let t: TestConvex;

beforeEach(() => {
  t = makeTest();
});

interface UserSeed {
  email?: string;
  verified?: boolean;
  google?: boolean;
  profile?: { role?: "user" | "moderator" | "admin"; status?: "active" | "suspended" } | false;
}

async function seedUser(seed: UserSeed = {}): Promise<Id<"users">> {
  const { email = "first@worldling.test", verified = true, google = false, profile = {} } = seed;
  return await t.run(async (ctx) => {
    const userId = await ctx.db.insert("users", {
      email,
      ...(verified && { emailVerificationTime: 1 }),
    });
    if (google) {
      await ctx.db.insert("authAccounts", { userId, provider: "google", providerAccountId: email });
    }
    if (profile !== false) {
      await ctx.db.insert("profiles", {
        userId,
        username: `u_${userId.slice(-8)}`,
        displayName: "First",
        role: profile.role ?? "user",
        status: profile.status ?? "active",
        emailPrefs: { cometAlerts: true, weeklyDigest: true, productUpdates: false },
      });
    }
    return userId;
  });
}

const bootstrap = (email: string) => t.mutation(internal.admin.system.bootstrapAdmin, { email });

async function roleOf(userId: Id<"users">) {
  return await t.run(async (ctx) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    return profile?.role;
  });
}

describe("admin.system.bootstrapAdmin", () => {
  it("promotes the first admin and audits it in the same transaction", async () => {
    const userId = await seedUser();
    const result = await bootstrap("  FIRST@worldling.test ");
    expect(result.userId).toBe(userId);
    expect(await roleOf(userId)).toBe("admin");

    const audit = await t.run(async (ctx) => ctx.db.query("auditLog").collect());
    expect(audit).toHaveLength(1);
    expect(audit[0]).toMatchObject({
      actorId: userId,
      action: "user.role.bootstrap",
      targetType: "user",
      targetId: userId,
      before: { role: "user" },
      after: { role: "admin" },
    });
  });

  it("refuses once any admin exists", async () => {
    await seedUser({ email: "boss@worldling.test", profile: { role: "admin" } });
    const userId = await seedUser();
    await expect(bootstrap("first@worldling.test")).rejects.toMatchObject(appErrorCode("CONFLICT"));
    expect(await roleOf(userId)).toBe("user");
  });

  it("works only once", async () => {
    await seedUser();
    await seedUser({ email: "second@worldling.test" });
    await bootstrap("first@worldling.test");
    await expect(bootstrap("second@worldling.test")).rejects.toMatchObject(
      appErrorCode("CONFLICT"),
    );
  });

  it("refuses an unknown email", async () => {
    await expect(bootstrap("nobody@worldling.test")).rejects.toMatchObject(
      appErrorCode("NOT_FOUND"),
    );
  });

  it("refuses an unverified email", async () => {
    await seedUser({ verified: false });
    await expect(bootstrap("first@worldling.test")).rejects.toMatchObject(
      appErrorCode("PRECONDITION"),
    );
    expect(await t.run(async (ctx) => ctx.db.query("auditLog").collect())).toHaveLength(0);
  });

  it("accepts a Google account without a password verification", async () => {
    const userId = await seedUser({ verified: false, google: true });
    await bootstrap("first@worldling.test");
    expect(await roleOf(userId)).toBe("admin");
  });

  it("refuses a user who has not onboarded or is suspended", async () => {
    await seedUser({ profile: false });
    await expect(bootstrap("first@worldling.test")).rejects.toMatchObject(
      appErrorCode("PRECONDITION"),
    );
    await seedUser({ email: "sus@worldling.test", profile: { status: "suspended" } });
    await expect(bootstrap("sus@worldling.test")).rejects.toMatchObject(
      appErrorCode("PRECONDITION"),
    );
  });
});
