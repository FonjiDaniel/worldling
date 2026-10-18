import type { WorkId } from "@convex-dev/workpool";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { internal } from "../_generated/api";
import type { Doc, Id } from "../_generated/dataModel";
import { encryptSecret } from "../lib/crypto";
import { makeTest, stubEmailEnv, type TestConvex } from "../test.helpers";

const WELCOME = {
  displayName: "Kai",
  worldName: "Mossbright",
  worldUrl: "https://worldling.app/w/kai",
};

let t: TestConvex;

beforeEach(() => {
  vi.spyOn(console, "info").mockImplementation(() => undefined);
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  stubEmailEnv();
  t = makeTest();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

/** Inserts a queued row without going through the workpool, so tests drive `send` directly. */
async function queued(
  to: string,
  template: Doc<"emailOutbox">["template"] = "account.welcome",
  data: unknown = WELCOME,
): Promise<Id<"emailOutbox">> {
  return await t.run(async (ctx) => {
    const category = template.startsWith("auth.") ? "security" : "transactional";
    return await ctx.db.insert("emailOutbox", {
      to,
      template,
      data,
      category,
      status: "queued",
      attempts: 0,
      idempotencyKey: `k:${to}:${Math.random()}`,
      rid: "rid-test",
    });
  });
}

async function row(id: Id<"emailOutbox">): Promise<Doc<"emailOutbox">> {
  const found = await t.run(async (ctx) => await ctx.db.get("emailOutbox", id));
  if (found === null) throw new Error("missing row");
  return found;
}

async function activeDbConfig(tamper = false): Promise<void> {
  const secret = await encryptSecret("abcd efgh ijkl mnop");
  const flipped = secret.ct.startsWith("A") ? "B" : "A";
  const password = tamper ? { ...secret, ct: `${flipped}${secret.ct.slice(1)}` } : secret;
  await t.run(async (ctx) => {
    const createdBy = await ctx.db.insert("users", { email: "admin@worldling.test" });
    await ctx.db.insert("emailConfigs", {
      status: "active",
      transport: "smtp",
      fromName: "Worldling",
      fromAddress: "hello@worldling.test",
      smtp: { host: "smtp.gmail.com", port: 465, secure: true, user: "hello", password },
      createdBy,
    });
  });
}

async function systemEvents() {
  return await t.run(async (ctx) => await ctx.db.query("systemEvents").collect());
}

describe("dispatch.send", () => {
  it("sends and records the provider message id", async () => {
    const id = await queued("kai@worldling.test");
    await t.action(internal.email.dispatch.send, { outboxId: id });
    expect(await row(id)).toMatchObject({ status: "sent", attempts: 1, provider: "fake" });
    expect((await row(id)).providerMessageId).toMatch(/^fake-/);
  });

  it("fails a permanent error at once and records a system event", async () => {
    const id = await queued("fail-permanent@worldling.test");
    await expect(t.action(internal.email.dispatch.send, { outboxId: id })).resolves.toBeNull();
    expect(await row(id)).toMatchObject({ status: "failed", lastError: "fake_permanent" });
    expect(await systemEvents()).toEqual([
      expect.objectContaining({ level: "error", code: "email.dispatch.failed" }),
    ]);
  });

  it("throws a retryable error so the workpool retries", async () => {
    const id = await queued("fail-retry@worldling.test");
    await expect(t.action(internal.email.dispatch.send, { outboxId: id })).rejects.toThrow(
      "retryable:fake_retry",
    );
    expect(await row(id)).toMatchObject({ status: "sending", attempts: 1 });
    expect(await systemEvents()).toHaveLength(0);
  });

  it("fails the row when the workpool runs out of retries", async () => {
    const id = await queued("fail-retry@worldling.test");
    await t.mutation(internal.email.outbox.onComplete, {
      workId: "work-1" as WorkId,
      context: { outboxId: id },
      result: { kind: "failed", error: "Uncaught EmailSendError: retryable:fake_retry" },
    });
    expect(await row(id)).toMatchObject({
      status: "failed",
      lastError: "retries_exhausted:fake_retry",
    });
    expect(await systemEvents()).toEqual([
      expect.objectContaining({ source: "email.dispatch", code: "email.dispatch.failed" }),
    ]);
  });

  it("fails permanently when no transport is configured", async () => {
    vi.stubEnv("EMAIL_FALLBACK_TRANSPORT", "");
    const id = await queued("kai@worldling.test");
    await t.action(internal.email.dispatch.send, { outboxId: id });
    expect(await row(id)).toMatchObject({ status: "failed", lastError: "no_transport" });
  });

  it("uses the active DB config over the env fallback", async () => {
    vi.stubEnv("EMAIL_FALLBACK_TRANSPORT", "");
    await activeDbConfig();
    const id = await queued("kai@worldling.test");
    await t.action(internal.email.dispatch.send, { outboxId: id });
    expect(await row(id)).toMatchObject({ status: "sent" });
  });

  it("fails permanently when the stored secret can't be decrypted", async () => {
    await activeDbConfig(true);
    const id = await queued("kai@worldling.test");
    await t.action(internal.email.dispatch.send, { outboxId: id });
    expect(await row(id)).toMatchObject({ status: "failed", lastError: "decrypt_failed" });
  });

  it("refuses non-security mail without a link secret", async () => {
    vi.stubEnv("EMAIL_LINK_SECRET", "");
    const id = await queued("kai@worldling.test");
    await t.action(internal.email.dispatch.send, { outboxId: id });
    expect(await row(id)).toMatchObject({ status: "failed", lastError: "missing_link_secret" });
  });

  it("refuses mail without SITE_URL, since the logo and links need it", async () => {
    vi.stubEnv("SITE_URL", "");
    const id = await queued("kai@worldling.test", "auth.verify", { code: "482913", minutes: 15 });
    await t.action(internal.email.dispatch.send, { outboxId: id });
    expect(await row(id)).toMatchObject({ status: "failed", lastError: "missing_site_url" });
  });

  it("clears security data once sent", async () => {
    const id = await queued("kai@worldling.test", "auth.verify", { code: "482913", minutes: 15 });
    await t.action(internal.email.dispatch.send, { outboxId: id });
    expect(await row(id)).toMatchObject({ status: "sent", data: null });
  });

  it("does nothing for a row that is already sent", async () => {
    const id = await queued("kai@worldling.test");
    await t.action(internal.email.dispatch.send, { outboxId: id });
    const sent = await row(id);
    await t.action(internal.email.dispatch.send, { outboxId: id });
    expect(await row(id)).toEqual(sent);
  });
});

describe("workpool path", () => {
  it("delivers an enqueued email end to end", async () => {
    vi.useFakeTimers();
    const { outboxId } = await t.mutation(internal.email.outbox.enqueue, {
      to: "kai@worldling.test",
      template: "account.welcome",
      data: WELCOME,
      idempotencyKey: "welcome:kai",
    });
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    expect(await row(outboxId)).toMatchObject({ status: "sent", attempts: 1 });
  });

  it("retries a retryable failure 5 times, then fails the row", async () => {
    vi.useFakeTimers();
    const { outboxId } = await t.mutation(internal.email.outbox.enqueue, {
      to: "fail-retry@worldling.test",
      template: "account.welcome",
      data: WELCOME,
      idempotencyKey: "welcome:retry",
    });
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    expect(await row(outboxId)).toMatchObject({
      status: "failed",
      attempts: 5,
      lastError: "retries_exhausted:fake_retry",
    });
  });
});
