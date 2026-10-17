import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { unsubscribeUrl } from "./email/links";
import { makeTest, stubEmailEnv, type TestConvex } from "./test.helpers";

const EMAIL = "kai@worldling.test";

let t: TestConvex;

beforeEach(() => {
  vi.spyOn(console, "info").mockImplementation(() => undefined);
  stubEmailEnv();
  t = makeTest();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

async function pathFor(scope: "digest" | "all_non_security" = "digest"): Promise<string> {
  const url = new URL(await unsubscribeUrl({ email: EMAIL, scope }, Date.now()));
  return `${url.pathname}${url.search}`;
}

async function suppressions() {
  return await t.run(async (ctx) => await ctx.db.query("emailSuppressions").collect());
}

describe("/email/unsubscribe", () => {
  it("GET asks first and changes nothing", async () => {
    const response = await t.fetch(await pathFor(), { method: "GET" });
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("weekly world digest");
    expect(html).toContain('method="post"');
    expect(await suppressions()).toHaveLength(0);
  });

  it("POST adds the suppression once", async () => {
    const path = await pathFor();
    const response = await t.fetch(path, {
      method: "POST",
      body: "List-Unsubscribe=One-Click",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    expect(response.status).toBe(200);
    expect(await response.text()).toContain("You're unsubscribed");
    await t.fetch(path, { method: "POST" });
    expect(await suppressions()).toEqual([
      expect.objectContaining({ email: EMAIL, scope: "digest", reason: "unsubscribed" }),
    ]);
  });

  it("rejects a bad token without writing", async () => {
    for (const method of ["GET", "POST"]) {
      const response = await t.fetch("/email/unsubscribe?t=nope.nope", { method });
      expect(response.status).toBe(400);
    }
    expect(await suppressions()).toHaveLength(0);
  });

  it("serves pages that can't be framed or cached", async () => {
    const response = await t.fetch(await pathFor("all_non_security"), { method: "GET" });
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("content-security-policy")).toContain("frame-ancestors 'none'");
  });
});
