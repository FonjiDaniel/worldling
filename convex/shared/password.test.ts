import { describe, expect, it } from "vitest";

import { checkPassword, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "./password";

describe("checkPassword", () => {
  it("accepts long passwords with no composition rules", () => {
    expect(checkPassword("mossy river stones")).toEqual({ ok: true });
    expect(checkPassword("a".repeat(PASSWORD_MIN_LENGTH - 1) + "b")).toEqual({ ok: true });
  });

  it("refuses short and overly long passwords", () => {
    expect(checkPassword("short")).toEqual({ ok: false, problem: "too_short" });
    expect(checkPassword("x".repeat(PASSWORD_MAX_LENGTH + 1))).toEqual({
      ok: false,
      problem: "too_long",
    });
  });

  it("refuses common passwords in any case", () => {
    expect(checkPassword("Password123")).toEqual({ ok: false, problem: "common" });
    expect(checkPassword("QWERTYUIOP")).toEqual({ ok: false, problem: "common" });
  });
});
