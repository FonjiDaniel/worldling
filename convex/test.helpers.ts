/// <reference types="vite/client" />
// Test-only helpers. The dotted file name keeps it out of Convex deploys.
import rateLimiterTest from "@convex-dev/rate-limiter/test";
import workpoolTest from "@convex-dev/workpool/test";
import { convexTest } from "convex-test";
import { expect, vi } from "vitest";

import type { Doc, Id } from "./_generated/dataModel";
import schema from "./schema";
import { modules } from "./test.setup";

type ModuleLoaders = Record<string, () => Promise<unknown>>;

/** A convex-test instance with our components. `extra` adds virtual modules, e.g. probes. */
export function makeTest(extra: ModuleLoaders = {}) {
  const t = convexTest(schema, { ...modules, ...extra });
  rateLimiterTest.register(t);
  workpoolTest.register(t, "emailWorkpool");
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

/** Env for email tests: fake provider, SMTP env fallback, link secret and site origin. */
export function stubEmailEnv(): void {
  vi.stubEnv("EMAIL_FAKE", "true");
  vi.stubEnv("APP_ENV", "test");
  vi.stubEnv("EMAIL_FALLBACK_TRANSPORT", "smtp");
  vi.stubEnv("SMTP_HOST", "smtp.gmail.com");
  vi.stubEnv("SMTP_PORT", "465");
  vi.stubEnv("SMTP_SECURE", "true");
  vi.stubEnv("SMTP_USER", "sender@worldling.test");
  vi.stubEnv("SMTP_PASSWORD", "app-password-1234");
  vi.stubEnv("EMAIL_FROM_NAME", "Worldling");
  vi.stubEnv("EMAIL_FROM_ADDRESS", "sender@worldling.test");
  vi.stubEnv("EMAIL_LINK_SECRET", "link-secret-for-tests-only");
  vi.stubEnv("CONVEX_SITE_URL", "https://worldling-test.convex.site");
  vi.stubEnv("SITE_URL", "https://worldling.test");
  vi.stubEnv("SECRETS_ENCRYPTION_KEY", "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=");
}

/** Matches an app error with `code`, for `rejects.toMatchObject`. */
export const appErrorCode = (value: string) => ({
  data: expect.objectContaining({ code: value }) as unknown,
});
