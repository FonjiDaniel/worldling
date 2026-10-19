import { describe, expect, it } from "vitest";

import { relativeTime } from "./relative-time";

const now = Date.parse("2026-10-19T12:00:00Z");
const ago = (seconds: number) => relativeTime(now - seconds * 1000, now);

describe("relativeTime", () => {
  it("says just now under a minute", () => {
    expect(ago(20)).toBe("just now");
  });

  it("picks the largest whole unit", () => {
    expect(ago(5 * 60)).toBe("5 minutes ago");
    expect(ago(3 * 60 * 60)).toBe("3 hours ago");
    expect(ago(24 * 60 * 60)).toBe("yesterday");
    expect(ago(14 * 24 * 60 * 60)).toBe("2 weeks ago");
  });
});
