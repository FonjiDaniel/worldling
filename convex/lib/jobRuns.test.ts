import { makeFunctionReference } from "convex/server";
import { v } from "convex/values";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { makeTest, type TestConvex } from "../test.helpers";
import { internalJobAction } from "./functions";
import { withJobRun, withJobRunInMutation } from "./jobRuns";

// Probe actions, mounted as a virtual module so nothing test-only deploys.
const probe = {
  ok: internalJobAction({
    args: {},
    handler: async (ctx) =>
      await withJobRun(ctx, "probe.ok", () => {
        ctx.log.info("probe.job.started");
        ctx.log.warn("probe.job.retry", { password: "hunter2", to: "kai@gmail.com" });
        return Promise.resolve(7);
      }),
  }),
  fails: internalJobAction({
    args: { message: v.string() },
    handler: async (ctx, { message }) =>
      await withJobRun(ctx, "probe.fails", () => {
        ctx.log.error("probe.job.failed", { message });
        return Promise.reject(new Error(`boom for kai@gmail.com`));
      }),
  }),
};

const ref = {
  ok: makeFunctionReference<"action">("probe:ok"),
  fails: makeFunctionReference<"action">("probe:fails"),
};

let t: TestConvex;
beforeEach(() => {
  vi.spyOn(console, "info").mockImplementation(() => undefined);
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  t = makeTest({ "./probe.ts": () => Promise.resolve(probe) });
});

afterEach(() => {
  vi.restoreAllMocks();
});

const allRows = () =>
  t.run(async (ctx) => ({
    runs: await ctx.db.query("jobRuns").take(10),
    events: await ctx.db.query("systemEvents").take(10),
  }));

describe("internalJobAction + withJobRun", () => {
  it("records a successful run and persists only warn/error, redacted", async () => {
    expect(await t.action(ref.ok, {})).toBe(7);
    const { runs, events } = await allRows();
    expect(runs).toHaveLength(1);
    expect(runs[0]).toMatchObject({ job: "probe.ok", ok: true, processed: 7 });
    expect(runs[0]?.finishedAt).toBeTypeOf("number");
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      level: "warn",
      source: "probe.job",
      code: "probe.job.retry",
      context: { password: "[redacted]", to: "k***@gmail.com" },
    });
    expect(events[0]?.rid).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("records a failed run and still flushes events when the action throws", async () => {
    await expect(t.action(ref.fails, { message: "Disk full" })).rejects.toThrow("boom");
    const { runs, events } = await allRows();
    expect(runs[0]).toMatchObject({ job: "probe.fails", ok: false });
    expect(runs[0]?.error).toContain("k***@gmail.com");
    expect(runs[0]?.error).not.toContain("kai@gmail.com");
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ level: "error", message: "Disk full" });
  });
});

describe("withJobRunInMutation", () => {
  it("writes a finished row in the same transaction", async () => {
    await t.run(async (ctx) => {
      expect(await withJobRunInMutation(ctx, "jobs.cleanup", () => Promise.resolve(3))).toBe(3);
    });
    const { runs } = await allRows();
    expect(runs[0]).toMatchObject({ job: "jobs.cleanup", ok: true, processed: 3 });
  });
});
