import { makeFunctionReference } from "convex/server";
import { beforeEach, describe, expect, it } from "vitest";

import type { MutationCtx } from "../_generated/server";
import { makeTest, seedViewer, setMaintenance, type TestConvex } from "../test.helpers";
import { appError } from "./errors";
import {
  adminMutation,
  adminQuery,
  publicQuery,
  staffMutation,
  staffQuery,
  userMutation,
  userQuery,
} from "./functions";

// Probe functions exist only here and are mounted as a virtual module, so nothing test-only deploys.
const writeSlot = async (ctx: MutationCtx) => {
  await ctx.db.insert("galaxy", { nextSlot: 1 });
  return null;
};

const probe = {
  publicWho: publicQuery({
    args: {},
    handler: (ctx) => ({
      userId: ctx.viewer?.userId ?? null,
      status: ctx.viewer?.profile?.status ?? null,
      rid: ctx.rid,
    }),
  }),
  userWho: userQuery({ args: {}, handler: (ctx) => ctx.viewer.profile.role }),
  staffWho: staffQuery({ args: {}, handler: (ctx) => ctx.viewer.profile.role }),
  adminWho: adminQuery({ args: {}, handler: (ctx) => ctx.viewer.profile.role }),
  userWrite: userMutation({ args: {}, handler: writeSlot }),
  staffWrite: staffMutation({ args: {}, handler: writeSlot }),
  adminWrite: adminMutation({ args: {}, handler: writeSlot }),
  failsExpected: userQuery({
    args: {},
    handler: () => {
      throw appError("NOT_FOUND", "Probe not found");
    },
  }),
  failsUnexpected: userQuery({
    args: {},
    handler: () => {
      throw new Error("boom");
    },
  }),
};

const ref = {
  publicWho: makeFunctionReference<
    "query",
    Record<string, never>,
    { userId: string | null; status: string | null; rid: string }
  >("probe:publicWho"),
  userWho: makeFunctionReference<"query">("probe:userWho"),
  staffWho: makeFunctionReference<"query">("probe:staffWho"),
  adminWho: makeFunctionReference<"query">("probe:adminWho"),
  userWrite: makeFunctionReference<"mutation">("probe:userWrite"),
  staffWrite: makeFunctionReference<"mutation">("probe:staffWrite"),
  adminWrite: makeFunctionReference<"mutation">("probe:adminWrite"),
  failsExpected: makeFunctionReference<"query">("probe:failsExpected"),
  failsUnexpected: makeFunctionReference<"query">("probe:failsUnexpected"),
};

const code = (value: string) => ({ data: expect.objectContaining({ code: value }) as unknown });
const UUID = /^[0-9a-f-]{36}$/;

let t: TestConvex;
beforeEach(() => {
  t = makeTest({ "./probe.ts": () => Promise.resolve(probe) });
});

describe("publicQuery", () => {
  it("gives a null viewer when signed out", async () => {
    const result = await t.query(ref.publicWho, {});
    expect(result).toMatchObject({ userId: null, status: null });
    expect(result.rid).toMatch(UUID);
  });

  it("passes a suspended viewer through", async () => {
    const { userId, client } = await seedViewer(t, { status: "suspended" });
    expect(await client.query(ref.publicWho, {})).toMatchObject({ userId, status: "suspended" });
  });

  it("treats a deleting viewer as signed out", async () => {
    const { client } = await seedViewer(t, { status: "deleting" });
    expect(await client.query(ref.publicWho, {})).toMatchObject({ userId: null });
  });

  it("gives a viewer without a profile before onboarding", async () => {
    const { userId, client } = await seedViewer(t, { onboarded: false });
    expect(await client.query(ref.publicWho, {})).toMatchObject({ userId, status: null });
  });
});

describe("userQuery and userMutation", () => {
  it("reject signed-out callers", async () => {
    await expect(t.query(ref.userWho, {})).rejects.toMatchObject(code("UNAUTHENTICATED"));
    await expect(t.mutation(ref.userWrite, {})).rejects.toMatchObject(code("UNAUTHENTICATED"));
  });

  it("reject deleting accounts as signed out", async () => {
    const { client } = await seedViewer(t, { status: "deleting" });
    await expect(client.query(ref.userWho, {})).rejects.toMatchObject(code("UNAUTHENTICATED"));
  });

  it("reject suspended accounts", async () => {
    const { client } = await seedViewer(t, { status: "suspended" });
    await expect(client.query(ref.userWho, {})).rejects.toMatchObject(code("SUSPENDED"));
    await expect(client.mutation(ref.userWrite, {})).rejects.toMatchObject(code("SUSPENDED"));
  });

  it("require onboarding", async () => {
    const { client } = await seedViewer(t, { onboarded: false });
    await expect(client.query(ref.userWho, {})).rejects.toMatchObject({
      data: expect.objectContaining({
        code: "PRECONDITION",
        details: { reason: "needs_onboarding" },
      }) as unknown,
    });
  });

  it("allow an active user", async () => {
    const { client } = await seedViewer(t);
    expect(await client.query(ref.userWho, {})).toBe("user");
    expect(await client.mutation(ref.userWrite, {})).toBeNull();
  });
});

describe("role checks", () => {
  const cases = [
    { role: "user", staff: false, admin: false },
    { role: "moderator", staff: true, admin: false },
    { role: "admin", staff: true, admin: true },
  ] as const;

  for (const { role, staff, admin } of cases) {
    it(`${role}: staff ${staff ? "allowed" : "forbidden"}, admin ${admin ? "allowed" : "forbidden"}`, async () => {
      const { client } = await seedViewer(t, { role });
      const checks = [
        { allowed: staff, run: () => client.query(ref.staffWho, {}) },
        { allowed: staff, run: () => client.mutation(ref.staffWrite, {}) },
        { allowed: admin, run: () => client.query(ref.adminWho, {}) },
        { allowed: admin, run: () => client.mutation(ref.adminWrite, {}) },
      ];
      for (const check of checks) {
        if (check.allowed) await expect(check.run()).resolves.toBeDefined();
        else await expect(check.run()).rejects.toMatchObject(code("FORBIDDEN"));
      }
    });
  }
});

describe("maintenance mode", () => {
  it("blocks user and staff mutations, not queries", async () => {
    await setMaintenance(t, true);
    const user = await seedViewer(t);
    const moderator = await seedViewer(t, { role: "moderator" });
    await expect(user.client.mutation(ref.userWrite, {})).rejects.toMatchObject(
      code("MAINTENANCE"),
    );
    await expect(moderator.client.mutation(ref.staffWrite, {})).rejects.toMatchObject(
      code("MAINTENANCE"),
    );
    expect(await user.client.query(ref.userWho, {})).toBe("user");
  });

  it("lets admins keep working", async () => {
    await setMaintenance(t, true);
    const { client } = await seedViewer(t, { role: "admin" });
    expect(await client.mutation(ref.userWrite, {})).toBeNull();
    expect(await client.mutation(ref.adminWrite, {})).toBeNull();
  });

  it("is off when the setting says so", async () => {
    await setMaintenance(t, false);
    const { client } = await seedViewer(t);
    expect(await client.mutation(ref.userWrite, {})).toBeNull();
  });
});

describe("errors", () => {
  it("attach the request id to app errors", async () => {
    const { client } = await seedViewer(t);
    await expect(client.query(ref.failsExpected, {})).rejects.toMatchObject({
      data: expect.objectContaining({
        code: "NOT_FOUND",
        rid: expect.stringMatching(UUID) as unknown,
      }) as unknown,
    });
    await expect(t.query(ref.userWho, {})).rejects.toMatchObject({
      data: expect.objectContaining({ rid: expect.stringMatching(UUID) as unknown }) as unknown,
    });
  });

  it("leave unexpected errors unconverted", async () => {
    const { client } = await seedViewer(t);
    const error: unknown = await client.query(ref.failsUnexpected, {}).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(Error);
    expect(error).not.toHaveProperty("data.code");
    expect(String(error)).toContain("boom");
  });
});
