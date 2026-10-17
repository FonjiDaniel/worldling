import { beforeEach, describe, expect, it } from "vitest";

import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { SESSION_BATCH } from "./model/sessions";
import { appErrorCode, makeTest, seedViewer, type TestConvex } from "./test.helpers";

let t: TestConvex;

beforeEach(() => {
  t = makeTest();
});

async function seedSessions(userId: Id<"users">, count: number) {
  await t.run(async (ctx) => {
    for (let i = 0; i < count; i += 1) {
      const sessionId = await ctx.db.insert("authSessions", { userId, expirationTime: 1e13 });
      await ctx.db.insert("authRefreshTokens", { sessionId, expirationTime: 1e13 });
    }
  });
}

async function countRows(userId: Id<"users">) {
  return await t.run(async (ctx) => {
    const sessions = await ctx.db
      .query("authSessions")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .collect();
    const tokens = await ctx.db.query("authRefreshTokens").collect();
    return { sessions: sessions.length, tokens: tokens.length };
  });
}

describe("sessions.signOutEverywhere", () => {
  it("deletes every session and refresh token of the viewer only", async () => {
    const { userId, client } = await seedViewer(t);
    const other = await seedViewer(t, { role: "moderator" });
    await seedSessions(userId, 3);
    await seedSessions(other.userId, 1);

    await client.mutation(api.sessions.signOutEverywhere, {});
    expect(await countRows(userId)).toEqual({ sessions: 0, tokens: 1 });
    expect((await countRows(other.userId)).sessions).toBe(1);
  });

  it("continues in scheduled batches when there are many", async () => {
    const { userId, client } = await seedViewer(t);
    await seedSessions(userId, SESSION_BATCH + 5);
    await client.mutation(api.sessions.signOutEverywhere, {});
    await t.finishAllScheduledFunctions(() => undefined);
    expect(await countRows(userId)).toEqual({ sessions: 0, tokens: 0 });
  });

  it("works while suspended and before onboarding, never signed out", async () => {
    const suspended = await seedViewer(t, { status: "suspended" });
    await seedSessions(suspended.userId, 1);
    await suspended.client.mutation(api.sessions.signOutEverywhere, {});
    expect((await countRows(suspended.userId)).sessions).toBe(0);

    const fresh = await seedViewer(t, { onboarded: false });
    await expect(fresh.client.mutation(api.sessions.signOutEverywhere, {})).resolves.toBeNull();

    await expect(t.mutation(api.sessions.signOutEverywhere, {})).rejects.toMatchObject(
      appErrorCode("UNAUTHENTICATED"),
    );
  });
});
