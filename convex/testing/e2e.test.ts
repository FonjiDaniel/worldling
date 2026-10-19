import { beforeEach, describe, expect, it, vi } from "vitest";

import { internal } from "../_generated/api";
import { makeTest, stubEmailEnv, type TestConvex } from "../test.helpers";

let t: TestConvex;

beforeEach(() => {
  stubEmailEnv();
  vi.stubEnv("EMAIL_FAKE", "");
  t = makeTest();
});

const to = "e2e+abc@e2e.worldling.test";

describe("e2e mailbox", () => {
  it("captures mail to e2e recipients through the real pipeline, then hands it out once", async () => {
    await t.mutation(internal.email.outbox.enqueue, {
      to,
      template: "auth.verify",
      data: { code: "12345678", minutes: 15 },
      idempotencyKey: "e2e-1",
    });
    await t.finishAllScheduledFunctions(() => undefined);

    const outbox = await t.run(async (ctx) => ctx.db.query("emailOutbox").first());
    expect(outbox).toMatchObject({ status: "sent", provider: "fake", data: null });

    const mail = await t.mutation(internal.testing.e2e.takeLatestEmail, { to: to.toUpperCase() });
    expect(mail).toEqual({ template: "auth.verify", data: { code: "12345678", minutes: 15 } });
    expect(await t.mutation(internal.testing.e2e.takeLatestEmail, { to })).toBeNull();
  });

  it("refuses to run on production", async () => {
    vi.stubEnv("APP_ENV", "production");
    await expect(t.mutation(internal.testing.e2e.takeLatestEmail, { to })).rejects.toThrow(
      /off on this deployment/,
    );
    await expect(
      t.query(internal.testing.world.worldState, { email: to, day: "2026-10-19" }),
    ).rejects.toThrow(/off on this deployment/);
    await expect(
      t.mutation(internal.testing.world.seedComets, { email: to, bodies: ["hi"] }),
    ).rejects.toThrow(/off on this deployment/);
    await expect(
      t.mutation(internal.testing.e2e.record, { to, template: "auth.verify", data: {} }),
    ).rejects.toThrow(/off on this deployment/);
  });

  it("refuses when APP_ENV is unset and ignores other recipients", async () => {
    vi.stubEnv("APP_ENV", "");
    await expect(t.mutation(internal.testing.e2e.takeLatestEmail, { to })).rejects.toThrow();
    vi.stubEnv("APP_ENV", "test");
    await expect(
      t.mutation(internal.testing.e2e.record, {
        to: "kai@worldling.test",
        template: "auth.verify",
        data: {},
      }),
    ).rejects.toThrow(/Not an e2e recipient/);
  });
});
