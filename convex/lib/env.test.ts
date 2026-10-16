import { afterEach, describe, expect, it, vi } from "vitest";

import { appEnv, optionalEnv, requireEnv } from "./env";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("requireEnv", () => {
  it("returns the value when set", () => {
    vi.stubEnv("SITE_URL", "https://worldling.test");
    expect(requireEnv("SITE_URL")).toBe("https://worldling.test");
  });

  it("throws MISSING_ENV with the name when unset", () => {
    vi.stubEnv("SMTP_HOST", undefined);
    expect(() => requireEnv("SMTP_HOST")).toThrow("MISSING_ENV: SMTP_HOST");
  });

  it("treats an empty string as missing", () => {
    vi.stubEnv("SMTP_HOST", "");
    expect(() => requireEnv("SMTP_HOST")).toThrow("MISSING_ENV: SMTP_HOST");
  });

  it("never puts the value in the error", () => {
    vi.stubEnv("APP_ENV", "staging-secret");
    expect(() => appEnv()).toThrow("INVALID_ENV: APP_ENV");
    expect(() => appEnv()).not.toThrow(/staging-secret/);
  });
});

describe("optionalEnv", () => {
  it("returns undefined when unset", () => {
    vi.stubEnv("RESEND_API_KEY", undefined);
    expect(optionalEnv("RESEND_API_KEY")).toBeUndefined();
  });
});

describe("appEnv", () => {
  it("accepts every allowed value", () => {
    for (const value of ["development", "preview", "production", "test"] as const) {
      vi.stubEnv("APP_ENV", value);
      expect(appEnv()).toBe(value);
    }
  });
});
