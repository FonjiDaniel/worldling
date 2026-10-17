/// <reference types="vite/client" />
// Test-only helpers. The dotted file name keeps it out of Convex deploys.
import rateLimiterTest from "@convex-dev/rate-limiter/test";
import { convexTest } from "convex-test";

import type { Doc, Id } from "./_generated/dataModel";
import schema from "./schema";
import { modules } from "./test.setup";

type ModuleLoaders = Record<string, () => Promise<unknown>>;

/** A convex-test instance with our components. `extra` adds virtual modules, e.g. probes. */
export function makeTest(extra: ModuleLoaders = {}) {
  const t = convexTest(schema, { ...modules, ...extra });
  rateLimiterTest.register(t);
  return t;
}

export type TestConvex = ReturnType<typeof makeTest>;

interface SeedOptions {
  role?: Doc<"profiles">["role"];
  status?: Doc<"profiles">["status"];
  /** false creates a signed-in user who has not onboarded yet. */
  onboarded?: boolean;
}

/** Inserts a user (and profile) and returns a client signed in as them. */
export async function seedViewer(t: TestConvex, options: SeedOptions = {}) {
  const { role = "user", status = "active", onboarded = true } = options;
  const userId: Id<"users"> = await t.run(async (ctx) => {
    const id = await ctx.db.insert("users", { email: `${role}@worldling.test` });
    if (onboarded) {
      await ctx.db.insert("profiles", {
        userId: id,
        username: `${role}_${id.slice(-6)}`,
        displayName: role,
        role,
        status,
        emailPrefs: { cometAlerts: true, weeklyDigest: true, productUpdates: false },
      });
    }
    return id;
  });
  return { userId, client: t.withIdentity({ subject: `${userId}|session` }) };
}

export async function setMaintenance(t: TestConvex, enabled: boolean): Promise<void> {
  await t.run(async (ctx) => {
    await ctx.db.insert("settings", {
      key: "maintenance",
      value: { enabled, message: "" },
      updatedAt: 0,
    });
  });
}
