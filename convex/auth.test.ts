import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "./_generated/api";
import { generateOtp, OTP_LENGTH } from "./lib/authEmail";
import { makeTest, stubEmailEnv, type TestConvex } from "./test.helpers";

let t: TestConvex;

beforeEach(() => {
  stubEmailEnv();
  vi.stubEnv("SITE_URL", "https://worldling.test");
  t = makeTest();
});

const password = "mossy river stones";

function signUp(email: string, pass = password) {
  return t.action(api.auth.signIn, {
    provider: "password",
    params: { email, password: pass, flow: "signUp" },
  });
}

async function outboxRows() {
  return await t.run(async (ctx) => ctx.db.query("emailOutbox").collect());
}

describe("generateOtp", () => {
  it("returns uniform-looking 8 digit codes", () => {
    const codes = Array.from({ length: 200 }, () => generateOtp());
    for (const code of codes) expect(code).toMatch(new RegExp(`^\\d{${String(OTP_LENGTH)}}$`));
    expect(new Set(codes).size).toBeGreaterThan(195);
  });
});

describe("password sign up", () => {
  it("normalizes the email and sends the code through our outbox as security mail", async () => {
    const result = await signUp("  Kai@Worldling.TEST ");
    expect(result).toEqual({ tokens: null }); // code sent, not signed in yet

    const rows = await outboxRows();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      to: "kai@worldling.test",
      template: "auth.verify",
      category: "security",
    });
    expect(rows[0]?.data).toMatchObject({ minutes: 15 });
    expect((rows[0]?.data as { code: string }).code).toMatch(/^\d{8}$/);
    expect(rows[0]?.idempotencyKey).not.toContain((rows[0]?.data as { code: string }).code);

    const users = await t.run(async (ctx) => ctx.db.query("users").collect());
    expect(users).toEqual([expect.objectContaining({ email: "kai@worldling.test" })]);
    expect(users[0]?.emailVerificationTime).toBeUndefined();
  });

  it("refuses weak passwords with a field error", async () => {
    await expect(signUp("kai@worldling.test", "password123")).rejects.toMatchObject({
      data: expect.objectContaining({
        code: "VALIDATION",
        details: { fieldErrors: { password: ["common"] } },
      }) as unknown,
    });
    expect(await outboxRows()).toHaveLength(0);
  });

  it("refuses new users when sign ups are closed", async () => {
    await t.run(async (ctx) => {
      await ctx.db.insert("settings", { key: "signups.enabled", value: false, updatedAt: 0 });
    });
    await expect(signUp("kai@worldling.test")).rejects.toMatchObject({
      data: expect.objectContaining({
        code: "PRECONDITION",
        details: { reason: "signups_closed" },
      }) as unknown,
    });
    expect(await t.run(async (ctx) => ctx.db.query("users").collect())).toHaveLength(0);
  });
});

describe("password reset", () => {
  it("sends a reset code through our outbox", async () => {
    await signUp("kai@worldling.test");
    await t.action(api.auth.signIn, {
      provider: "password",
      params: { email: "kai@worldling.test", flow: "reset" },
    });
    const templates = (await outboxRows()).map((row) => row.template);
    expect(templates).toEqual(["auth.verify", "auth.reset"]);
  });
});

async function stubJwtKey(): Promise<void> {
  const pair = await crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"],
  );
  const der = new Uint8Array(await crypto.subtle.exportKey("pkcs8", pair.privateKey));
  const body = btoa(String.fromCharCode(...der));
  vi.stubEnv("JWT_PRIVATE_KEY", `-----BEGIN PRIVATE KEY----- ${body} -----END PRIVATE KEY-----`);
}

describe("email verification", () => {
  it("signs in with the emailed code, whatever case the email was typed in", async () => {
    await stubJwtKey();
    await signUp("Kai@Worldling.test");
    const code = ((await outboxRows())[0]?.data as { code: string }).code;

    const wrong = t.action(api.auth.signIn, {
      provider: "password",
      params: { email: "kai@worldling.test", code: "00000000", flow: "email-verification" },
    });
    await expect(wrong).rejects.toThrow();

    const result = await t.action(api.auth.signIn, {
      provider: "password",
      params: { email: "KAI@worldling.test", code, flow: "email-verification" },
    });
    expect(result.tokens?.token).toEqual(expect.any(String));
    const users = await t.run(async (ctx) => ctx.db.query("users").collect());
    expect(users).toHaveLength(1);
    expect(users[0]).toMatchObject({ email: "kai@worldling.test" });
    expect(users[0]?.emailVerificationTime).toEqual(expect.any(Number));
  });
});
