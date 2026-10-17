import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "../_generated/api";
import type { Doc, Id } from "../_generated/dataModel";
import { appErrorCode, makeTest, seedViewer, stubEmailEnv, type TestConvex } from "../test.helpers";

const PASSWORD = "abcd efgh ijkl mnop";
const SMTP = {
  transport: "smtp" as const,
  fromName: "Worldling",
  fromAddress: "hello@worldling.test",
  smtp: { host: "smtp.gmail.com", port: 465, secure: true, user: "hello@worldling.test" },
};

let t: TestConvex;
let admin: Awaited<ReturnType<typeof seedViewer>>;

beforeEach(async () => {
  vi.spyOn(console, "info").mockImplementation(() => undefined);
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
  stubEmailEnv();
  t = makeTest();
  admin = await seedViewer(t, { role: "admin" });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

async function create(input: object = { ...SMTP, smtp: { ...SMTP.smtp, password: PASSWORD } }) {
  return await admin.client.mutation(api.admin.email.createConfig, input as typeof SMTP);
}

async function config(id: Id<"emailConfigs">): Promise<Doc<"emailConfigs">> {
  const found = await t.run(async (ctx) => await ctx.db.get("emailConfigs", id));
  if (found === null) throw new Error("missing config");
  return found;
}

async function setStatus(id: Id<"emailConfigs">, status: Doc<"emailConfigs">["status"]) {
  await t.run(async (ctx) => {
    await ctx.db.patch("emailConfigs", id, { status });
  });
}

async function testSend(id: Id<"emailConfigs">) {
  vi.useFakeTimers();
  await admin.client.mutation(api.admin.email.requestTestSend, { configId: id });
  await t.finishAllScheduledFunctions(vi.runAllTimers);
  vi.useRealTimers();
}

describe("access", () => {
  it("is admin only", async () => {
    for (const role of ["user", "moderator"] as const) {
      const { client } = await seedViewer(t, { role });
      await expect(client.query(api.admin.email.listConfigs, {})).rejects.toMatchObject(
        appErrorCode("FORBIDDEN"),
      );
      await expect(
        client.mutation(api.admin.email.createConfig, { ...SMTP }),
      ).rejects.toMatchObject(appErrorCode("FORBIDDEN"));
    }
  });
});

describe("create and update", () => {
  it("encrypts secrets and only ever shows a hint", async () => {
    const id = await create();
    const stored = await config(id);
    expect(stored.status).toBe("draft");
    expect(stored.smtp?.password?.ct).not.toContain(PASSWORD);
    const [view] = await admin.client.query(api.admin.email.listConfigs, {});
    expect(view?.smtp?.password).toEqual({ configured: true, last4: "mnop" });
    const json = JSON.stringify(view);
    expect(json).not.toContain(PASSWORD);
    expect(json).not.toContain(stored.smtp?.password?.ct);
  });

  it("requires a secret on create", async () => {
    await expect(create(SMTP)).rejects.toMatchObject(appErrorCode("VALIDATION"));
    await expect(create({ ...SMTP, fromAddress: "nope" })).rejects.toMatchObject(
      appErrorCode("VALIDATION"),
    );
  });

  it("resets to draft on update and keeps an omitted secret", async () => {
    const id = await create();
    await setStatus(id, "verified");
    const before = await config(id);
    await admin.client.mutation(api.admin.email.updateConfig, {
      configId: id,
      ...SMTP,
      fromName: "Worldling Team",
    });
    const after = await config(id);
    expect(after).toMatchObject({ status: "draft", fromName: "Worldling Team" });
    expect(after.smtp?.password).toEqual(before.smtp?.password);
  });

  it("locks active and retired configs", async () => {
    const id = await create();
    for (const status of ["active", "retired"] as const) {
      await setStatus(id, status);
      await expect(
        admin.client.mutation(api.admin.email.updateConfig, { configId: id, ...SMTP }),
      ).rejects.toMatchObject(appErrorCode("PRECONDITION"));
    }
  });
});

describe("test send", () => {
  it("verifies a draft when the test arrives", async () => {
    const id = await create();
    await testSend(id);
    expect(await config(id)).toMatchObject({ status: "verified", lastTest: { ok: true } });
  });

  it("records a failed test and stays draft", async () => {
    await t.run(async (ctx) => {
      await ctx.db.patch("users", admin.userId, { email: "fail-permanent@worldling.test" });
    });
    const id = await create();
    await testSend(id);
    expect(await config(id)).toMatchObject({
      status: "draft",
      lastTest: { ok: false, error: "fake_permanent" },
    });
  });

  it("ignores a result for settings that changed since the request", async () => {
    vi.useFakeTimers();
    const id = await create();
    await admin.client.mutation(api.admin.email.requestTestSend, { configId: id });
    await admin.client.mutation(api.admin.email.updateConfig, {
      configId: id,
      ...SMTP,
      fromName: "Changed",
    });
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    const after = await config(id);
    expect(after.status).toBe("draft");
    expect(after.lastTest).toBeUndefined();
  });

  it("allows 5 tests per 10 minutes", async () => {
    const id = await create();
    for (let i = 0; i < 5; i++) {
      await admin.client.mutation(api.admin.email.requestTestSend, { configId: id });
    }
    await expect(
      admin.client.mutation(api.admin.email.requestTestSend, { configId: id }),
    ).rejects.toMatchObject(appErrorCode("RATE_LIMITED"));
  });
});

describe("activation", () => {
  it("only activates verified configs", async () => {
    const id = await create();
    await expect(
      admin.client.mutation(api.admin.email.activate, { configId: id }),
    ).rejects.toMatchObject(appErrorCode("PRECONDITION"));
  });

  it("retires the previous active config, and rollback brings it back", async () => {
    const first = await create();
    const second = await create();
    await setStatus(first, "verified");
    await setStatus(second, "verified");
    await admin.client.mutation(api.admin.email.activate, { configId: first });
    await admin.client.mutation(api.admin.email.activate, { configId: second });
    expect((await config(first)).status).toBe("retired");
    expect((await config(second)).status).toBe("active");

    await expect(
      admin.client.mutation(api.admin.email.rollbackTo, { configId: second }),
    ).rejects.toMatchObject(appErrorCode("PRECONDITION"));
    await admin.client.mutation(api.admin.email.rollbackTo, { configId: first });
    expect((await config(first)).status).toBe("active");
    expect((await config(second)).status).toBe("retired");
  });

  it("shows the source in the overview", async () => {
    expect(await admin.client.query(api.admin.email.overview, {})).toMatchObject({
      source: "env",
      active: null,
      gmailQuotaWarning: true,
    });
    const id = await create();
    await setStatus(id, "verified");
    await admin.client.mutation(api.admin.email.activate, { configId: id });
    expect(await admin.client.query(api.admin.email.overview, {})).toMatchObject({
      source: "db",
      active: { _id: id },
    });
  });
});

describe("audit", () => {
  it("writes an entry per change without secret values", async () => {
    const id = await create();
    await setStatus(id, "verified");
    await admin.client.mutation(api.admin.email.activate, { configId: id });
    const entries = await t.run(async (ctx) => await ctx.db.query("auditLog").collect());
    expect(entries.map((entry) => entry.action)).toEqual([
      "email.config.create",
      "email.config.activate",
    ]);
    const json = JSON.stringify(entries);
    expect(json).not.toContain(PASSWORD);
    expect(json).not.toContain((await config(id)).smtp?.password?.ct);
    expect(entries[0]).toMatchObject({ actorId: admin.userId, targetId: id });
  });
});
