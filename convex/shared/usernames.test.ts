import { describe, expect, it } from "vitest";

import { checkDisplayName, checkUsername, normalizeUsername } from "./usernames";

describe("checkUsername", () => {
  it("normalizes case, spaces and a leading @", () => {
    expect(normalizeUsername("  @Dawn_Light ")).toBe("dawn_light");
    expect(checkUsername("Dawn_Light")).toEqual({ ok: true, username: "dawn_light" });
  });

  it.each(["ab", "a".repeat(21), "dawn-light", "dawn light", "dåwn", ""])(
    "refuses the format of %j",
    (raw) => {
      expect(checkUsername(raw)).toEqual({ ok: false, reason: "format" });
    },
  );

  it.each(["admin", "API", "worldling", "sign_in", "onboarding", "null", "support"])(
    "refuses reserved %j",
    (raw) => {
      expect(checkUsername(raw)).toEqual({ ok: false, reason: "reserved" });
    },
  );

  it("refuses admin-managed reserved names", () => {
    expect(checkUsername("stardust", { extraReserved: ["Stardust"] })).toEqual({
      ok: false,
      reason: "reserved",
    });
  });

  it("refuses profanity, including split by underscores", () => {
    expect(checkUsername("fuck_this")).toEqual({ ok: false, reason: "moderation" });
    expect(checkUsername("shit")).toEqual({ ok: false, reason: "moderation" });
  });

  it("refuses admin-managed extra words", () => {
    expect(checkUsername("grumbly_cat", { extraWords: ["grumbly"] })).toEqual({
      ok: false,
      reason: "moderation",
    });
  });

  it("allows ordinary names that contain unlucky substrings", () => {
    expect(checkUsername("scunthorpe").ok).toBe(true);
    expect(checkUsername("classic_glass").ok).toBe(true);
  });
});

describe("checkDisplayName", () => {
  it("trims, collapses whitespace and drops control characters", () => {
    expect(checkDisplayName("  Kai \u0007  Moon  ")).toEqual({ ok: true, displayName: "Kai Moon" });
  });

  it("counts graphemes, not code units", () => {
    expect(checkDisplayName("👩‍🚀".repeat(40)).ok).toBe(true);
    expect(checkDisplayName("a".repeat(41))).toEqual({ ok: false, reason: "too_long" });
  });

  it("refuses empty and unkind names", () => {
    expect(checkDisplayName("   ")).toEqual({ ok: false, reason: "empty" });
    expect(checkDisplayName("big bitch")).toEqual({ ok: false, reason: "moderation" });
    expect(checkDisplayName("visit www.spam.com")).toEqual({ ok: false, reason: "moderation" });
  });
});
