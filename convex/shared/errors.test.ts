import { describe, expect, it } from "vitest";

import { ErrorCode, isAppErrorData, userMessageFor } from "./errors";

describe("userMessageFor", () => {
  it("has short, plain copy for every code with no em dashes", () => {
    for (const code of Object.values(ErrorCode)) {
      const message = userMessageFor(code);
      expect(message.length).toBeGreaterThan(0);
      expect(message.length).toBeLessThan(80);
      expect(message).not.toMatch(/[—–]/);
    }
  });

  it("counts down rate limits in friendly units", () => {
    expect(userMessageFor("RATE_LIMITED", { retryAfterMs: 1000 })).toBe(
      "Too many tries for now. Try again in 1 second.",
    );
    expect(userMessageFor("RATE_LIMITED", { retryAfterMs: 11_200 })).toBe(
      "Too many tries for now. Try again in 12 seconds.",
    );
    expect(userMessageFor("RATE_LIMITED", { retryAfterMs: 90_000 })).toBe(
      "Too many tries for now. Try again in 2 minutes.",
    );
    expect(userMessageFor("RATE_LIMITED", { retryAfterMs: 5 * 3_600_000 })).toBe(
      "Too many tries for now. Try again in 5 hours.",
    );
    expect(userMessageFor("RATE_LIMITED")).toBe("Too many tries for now. Try again in a moment.");
  });
});

describe("isAppErrorData", () => {
  it("accepts our shape and rejects others", () => {
    expect(isAppErrorData({ code: "NOT_FOUND", message: "x" })).toBe(true);
    expect(isAppErrorData({ code: "NOT_FOUND", message: "x", details: {}, rid: "r" })).toBe(true);
    expect(isAppErrorData({ code: "NOPE", message: "x" })).toBe(false);
    expect(isAppErrorData({ code: "NOT_FOUND" })).toBe(false);
    expect(isAppErrorData({ code: "NOT_FOUND", message: "x", rid: 1 })).toBe(false);
    expect(isAppErrorData("NOT_FOUND")).toBe(false);
    expect(isAppErrorData(null)).toBe(false);
  });
});
