import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { makeTest, type TestConvex } from "../test.helpers";
import { enforceRateLimit } from "./rateLimits";
import { MINUTE_MS } from "./time";

let t: TestConvex;
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-17T12:00:00Z"));
  t = makeTest();
});

afterEach(() => {
  vi.useRealTimers();
});

const consume = (name: Parameters<typeof enforceRateLimit>[1], key: string) =>
  t.run((ctx) => enforceRateLimit(ctx, name, key));

describe("enforceRateLimit", () => {
  it("allows up to the limit, then throws RATE_LIMITED with retryAfterMs", async () => {
    for (let i = 0; i < 5; i++) await consume("comet.send", "user_a");
    const error: unknown = await consume("comet.send", "user_a").catch((e: unknown) => e);
    expect(error).toMatchObject({ data: { code: "RATE_LIMITED" } });
    const retryAfterMs = (error as { data: { details: { retryAfterMs: number } } }).data.details
      .retryAfterMs;
    expect(retryAfterMs).toBeGreaterThan(0);
    expect(retryAfterMs).toBeLessThanOrEqual(MINUTE_MS);
  });

  it("keeps keys independent", async () => {
    for (let i = 0; i < 5; i++) await consume("comet.send", "user_a");
    await expect(consume("comet.send", "user_b")).resolves.toBeNull();
  });

  it("keeps limits independent", async () => {
    for (let i = 0; i < 3; i++) await consume("world.create", "user_a");
    await expect(consume("world.create", "user_a")).rejects.toMatchObject({
      data: { code: "RATE_LIMITED" },
    });
    await expect(consume("comet.send", "user_a")).resolves.toBeNull();
  });

  it("refills the token bucket over time", async () => {
    for (let i = 0; i < 5; i++) await consume("comet.send", "user_a");
    vi.advanceTimersByTime(MINUTE_MS);
    await expect(consume("comet.send", "user_a")).resolves.toBeNull();
  });
});
