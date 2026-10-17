import { describe, expect, it } from "vitest";

import { appErrorFromText, toAuthError } from "./errors";

// Text shaped exactly like the proxy's `{"error": "..."}` body (checked against dev in Phase 4).
const proxied = (inner: string) =>
  new Error(`[Request ID: 8eaa7f1a26495f2b] Server Error\nUncaught ${inner}\n`);

describe("appErrorFromText", () => {
  it("recovers app error data from proxied text", () => {
    const error = proxied(
      'ConvexError: {"code":"RATE_LIMITED","message":"x","details":{"retryAfterMs":4000}}',
    );
    expect(appErrorFromText(error.message)).toEqual({
      code: "RATE_LIMITED",
      message: "x",
      details: { retryAfterMs: 4000 },
    });
  });

  it("ignores text without app error data", () => {
    expect(appErrorFromText("Uncaught Error: InvalidSecret")).toBeNull();
    expect(appErrorFromText('ConvexError: {"nope":1}')).toBeNull();
    expect(appErrorFromText("ConvexError: {broken")).toBeNull();
  });
});

describe("toAuthError", () => {
  it("maps password policy errors to the password field", () => {
    const error = proxied(
      'ConvexError: {"code":"VALIDATION","message":"x","details":{"fieldErrors":{"password":["common"]}}}',
    );
    expect(toAuthError(error).fieldErrors.password).toMatch(/too easy to guess/);
  });

  it("keeps the countdown for rate limits", () => {
    const error = proxied(
      'ConvexError: {"code":"RATE_LIMITED","message":"x","details":{"retryAfterMs":65000}}',
    );
    expect(toAuthError(error)).toMatchObject({ retryAfterMs: 65000, message: /2 minutes/ });
  });

  it("explains closed sign ups", () => {
    const error = proxied(
      'ConvexError: {"code":"PRECONDITION","message":"x","details":{"reason":"signups_closed"}}',
    );
    expect(toAuthError(error).message).toMatch(/paused/);
  });

  it.each([
    ["Uncaught Error: InvalidAccountId", /don't match/, undefined],
    ["Uncaught Error: InvalidSecret", /don't match/, undefined],
    ["Uncaught Error: Could not verify code", /code didn't work/, "code"],
    ["Uncaught Error: TooManyFailedAttempts", /Too many tries/, undefined],
    ["Uncaught Error: Account kai@worldling.test already exists", /Sign in instead/, "email"],
    ["TypeError: Failed to fetch", /connection/, undefined],
  ])("maps %j", (text, message, field) => {
    const result = toAuthError(new Error(text));
    expect(result.message).toMatch(message);
    expect(Object.keys(result.fieldErrors)).toEqual(field === undefined ? [] : [field]);
  });

  it("flags an unknown account only for InvalidAccountId", () => {
    expect(toAuthError(new Error("InvalidAccountId")).unknownAccount).toBe(true);
    expect(toAuthError(new Error("InvalidSecret")).unknownAccount).toBeUndefined();
  });

  it("never shows unknown server text", () => {
    const result = toAuthError(new Error("Uncaught Error: Missing environment variable `JWKS`"));
    expect(result.message).not.toMatch(/JWKS/);
  });
});
