import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LINK_TTL_MS, signLinkToken, unsubscribeUrl, verifyLinkToken } from "./links";

const NOW = Date.UTC(2026, 9, 17);
const CLAIMS = { email: "kai@worldling.test", scope: "digest" } as const;

beforeEach(() => {
  vi.stubEnv("EMAIL_LINK_SECRET", "link-secret-for-tests-only");
  vi.stubEnv("CONVEX_SITE_URL", "https://worldling-test.convex.site");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("link tokens", () => {
  it("round trips the claims", async () => {
    const token = await signLinkToken(CLAIMS, NOW);
    expect(await verifyLinkToken(token, NOW + 1000)).toEqual(CLAIMS);
  });

  it("rejects a tampered payload", async () => {
    const [, signature] = (await signLinkToken(CLAIMS, NOW)).split(".");
    const forged = btoa(JSON.stringify({ e: "ana@worldling.test", s: "digest", x: NOW * 2 }))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    expect(await verifyLinkToken(`${forged}.${signature ?? ""}`, NOW)).toBeNull();
  });

  it("rejects a token signed with another secret", async () => {
    const token = await signLinkToken(CLAIMS, NOW);
    vi.stubEnv("EMAIL_LINK_SECRET", "a-different-secret");
    expect(await verifyLinkToken(token, NOW)).toBeNull();
  });

  it("rejects an expired token", async () => {
    const token = await signLinkToken(CLAIMS, NOW);
    expect(await verifyLinkToken(token, NOW + LINK_TTL_MS + 1)).toBeNull();
  });

  it.each(["", "abc", "a.b.c", "!!!.???", "e30.e30"])("rejects garbage %j", async (token) => {
    expect(await verifyLinkToken(token, NOW)).toBeNull();
  });

  it("builds the unsubscribe URL on the HTTP actions origin", async () => {
    const url = new URL(await unsubscribeUrl(CLAIMS, NOW));
    expect(url.origin).toBe("https://worldling-test.convex.site");
    expect(url.pathname).toBe("/email/unsubscribe");
    expect(await verifyLinkToken(url.searchParams.get("t") ?? "", NOW)).toEqual(CLAIMS);
  });
});
