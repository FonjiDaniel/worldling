import { describe, expect, it } from "vitest";

import { addUtcDays, DAY_MS, startOfUtcDay, utcDay } from "./time";

describe("utcDay", () => {
  it("formats the UTC day, not the local one", () => {
    expect(utcDay(Date.parse("2026-10-17T23:59:59.999Z"))).toBe("2026-10-17");
    expect(utcDay(Date.parse("2026-10-18T00:00:00.000Z"))).toBe("2026-10-18");
  });
});

describe("startOfUtcDay", () => {
  it("returns midnight UTC", () => {
    expect(startOfUtcDay("2026-10-17")).toBe(Date.parse("2026-10-17T00:00:00.000Z"));
  });

  it("rejects malformed or impossible days", () => {
    expect(() => startOfUtcDay("2026-2-1")).toThrow("Invalid UTC day");
    expect(() => startOfUtcDay("2026-02-30")).toThrow("Invalid UTC day");
  });
});

describe("addUtcDays", () => {
  it("crosses month and year boundaries", () => {
    expect(addUtcDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addUtcDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(startOfUtcDay(addUtcDays("2026-10-17", 7)) - startOfUtcDay("2026-10-17")).toBe(
      7 * DAY_MS,
    );
  });
});
