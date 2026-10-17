import { describe, expect, it, vi } from "vitest";

import { makeTest, seedViewer } from "../test.helpers";
import { writeAudit } from "./audit";
import type { Logger } from "./logger";
import { getSetting, isFlagOn, setSetting } from "./settings";

describe("getSetting", () => {
  it("returns registry defaults when unset", async () => {
    const t = makeTest();
    await t.run(async (ctx) => {
      expect(await getSetting(ctx, "maintenance")).toEqual({ enabled: false, message: "" });
      expect(await isFlagOn(ctx, "signups.enabled")).toBe(true);
      expect(await isFlagOn(ctx, "shop.enabled")).toBe(false);
    });
  });

  it("falls back to the default and warns on an invalid stored value", async () => {
    const t = makeTest();
    const warn = vi.fn();
    const log: Logger = { info: vi.fn(), warn, error: vi.fn() };
    await t.run(async (ctx) => {
      await ctx.db.insert("settings", { key: "comets.enabled", value: "yes", updatedAt: 0 });
      expect(await getSetting({ db: ctx.db, log }, "comets.enabled")).toBe(true);
    });
    expect(warn).toHaveBeenCalledWith("settings.read.invalid", { key: "comets.enabled" });
  });
});

describe("setSetting", () => {
  it("upserts, then audits before and after", async () => {
    const t = makeTest();
    const { userId } = await seedViewer(t, { role: "admin" });
    await t.run(async (ctx) => {
      const audit = { db: ctx.db, rid: "r1", viewer: { userId } };
      await setSetting(audit, "comets.enabled", false);
      await setSetting(audit, "comets.enabled", true);
      expect(await getSetting(ctx, "comets.enabled")).toBe(true);
      const rows = await ctx.db
        .query("settings")
        .withIndex("by_key", (q) => q.eq("key", "comets.enabled"))
        .take(5);
      expect(rows).toHaveLength(1);
      const entries = await ctx.db
        .query("auditLog")
        .withIndex("by_target", (q) =>
          q.eq("targetType", "setting").eq("targetId", "comets.enabled"),
        )
        .take(5);
      expect(entries.map((e): unknown[] => [e.before, e.after])).toEqual([
        [undefined, false],
        [false, true],
      ]);
      expect(entries[0]).toMatchObject({ actorId: userId, action: "settings.update", rid: "r1" });
    });
  });

  it("rejects invalid values with VALIDATION and writes nothing", async () => {
    const t = makeTest();
    const { userId } = await seedViewer(t, { role: "admin" });
    await t.run(async (ctx) => {
      const audit = { db: ctx.db, rid: "r1", viewer: { userId } };
      await expect(
        setSetting(audit, "maintenance", { enabled: "yes", message: "" }),
      ).rejects.toMatchObject({ data: { code: "VALIDATION" } });
      expect(await ctx.db.query("auditLog").take(1)).toHaveLength(0);
    });
  });
});

describe("writeAudit", () => {
  it("redacts secrets in before and after", async () => {
    const t = makeTest();
    const { userId } = await seedViewer(t, { role: "admin" });
    await t.run(async (ctx) => {
      const id = await writeAudit(
        { db: ctx.db, rid: "r1", viewer: { userId } },
        {
          action: "email.config.update",
          targetType: "emailConfig",
          targetId: "c1",
          before: { host: "smtp.gmail.com", password: "old" },
          after: { host: "smtp.gmail.com", password: "new", apiKey: "re_1" },
          reason: "rotate",
        },
      );
      const entry = await ctx.db.get(id);
      expect(entry).toMatchObject({
        before: { host: "smtp.gmail.com", password: "[redacted]" },
        after: { password: "[redacted]", apiKey: "[redacted]" },
        reason: "rotate",
      });
    });
  });
});
