import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { internal } from "../_generated/api";
import type { Doc } from "../_generated/dataModel";
import { appErrorCode, makeTest, stubEmailEnv, type TestConvex } from "../test.helpers";

const WELCOME = {
  displayName: "Kai",
  worldName: "Mossbright",
  worldUrl: "https://worldling.app/w/kai",
};
const VERIFY = { code: "482913", minutes: 15 };

let t: TestConvex;
let key = 0;

beforeEach(() => {
  vi.spyOn(console, "info").mockImplementation(() => undefined);
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
  stubEmailEnv();
  t = makeTest();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

function enqueue(template: string, data: unknown, to = "kai@worldling.test", idem?: string) {
  return t.mutation(internal.email.outbox.enqueue, {
    to,
    template,
    data,
    idempotencyKey: idem ?? `key-${++key}`,
  });
}

async function rows(): Promise<Doc<"emailOutbox">[]> {
  return await t.run(async (ctx) => await ctx.db.query("emailOutbox").collect());
}

async function suppress(email: string, scope: Doc<"emailSuppressions">["scope"]) {
  await t.run(async (ctx) => {
    await ctx.db.insert("emailSuppressions", { email, scope, reason: "unsubscribed" });
  });
}

describe("enqueueEmail", () => {
  it("queues a row with the category from the registry", async () => {
    const result = await enqueue("account.welcome", WELCOME, "  Kai@Worldling.TEST ");
    expect(result).toMatchObject({ status: "queued", deduped: false });
    const [row] = await rows();
    expect(row).toMatchObject({
      to: "kai@worldling.test",
      template: "account.welcome",
      category: "transactional",
      status: "queued",
      attempts: 0,
    });
    expect(row?.rid).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("rejects data that fails the template schema", async () => {
    await expect(enqueue("account.welcome", { displayName: "Kai" })).rejects.toMatchObject(
      appErrorCode("VALIDATION"),
    );
    expect(await rows()).toHaveLength(0);
  });

  it("rejects unknown templates and bad recipients", async () => {
    await expect(enqueue("nope.never", {})).rejects.toMatchObject(appErrorCode("VALIDATION"));
    await expect(enqueue("auth.verify", VERIFY, "not-an-email")).rejects.toMatchObject(
      appErrorCode("VALIDATION"),
    );
  });

  it("returns the existing row for a repeated idempotency key", async () => {
    const first = await enqueue("auth.verify", VERIFY, undefined, "otp:1");
    const second = await enqueue("auth.verify", VERIFY, undefined, "otp:1");
    expect(second).toEqual({ ...first, deduped: true });
    expect(await rows()).toHaveLength(1);
  });
});

describe("suppressions", () => {
  it("suppresses a template whose narrow scope is turned off", async () => {
    await suppress("kai@worldling.test", "comet_alerts");
    const alert = await enqueue("comets.alert", {
      ...WELCOME,
      count: 1,
      comets: [{ from: "Ana", text: "Hi" }],
    });
    expect(alert.status).toBe("suppressed");
    expect((await enqueue("account.welcome", WELCOME)).status).toBe("queued");
  });

  it("all_non_security blocks every non-security template", async () => {
    await suppress("kai@worldling.test", "all_non_security");
    expect((await enqueue("account.welcome", WELCOME)).status).toBe("suppressed");
  });

  it("never suppresses security mail", async () => {
    await suppress("kai@worldling.test", "all_non_security");
    expect((await enqueue("auth.verify", VERIFY)).status).toBe("queued");
  });
});

describe("per-recipient rate limit", () => {
  it("cancels the 6th non-security email in an hour", async () => {
    for (let i = 0; i < 5; i++) {
      expect((await enqueue("account.welcome", WELCOME)).status).toBe("queued");
    }
    expect((await enqueue("account.welcome", WELCOME)).status).toBe("cancelled");
    const cancelled = (await rows()).filter((row) => row.status === "cancelled");
    expect(cancelled).toEqual([expect.objectContaining({ lastError: "rate_limited" })]);
  });

  it("allows 10 security emails, then throws RATE_LIMITED", async () => {
    for (let i = 0; i < 10; i++) await enqueue("auth.verify", VERIFY);
    await expect(enqueue("auth.verify", VERIFY)).rejects.toMatchObject(
      appErrorCode("RATE_LIMITED"),
    );
    expect(await rows()).toHaveLength(10);
  });

  it("limits each recipient separately", async () => {
    for (let i = 0; i < 5; i++) await enqueue("account.welcome", WELCOME);
    expect((await enqueue("account.welcome", WELCOME, "ana@worldling.test")).status).toBe("queued");
  });
});
