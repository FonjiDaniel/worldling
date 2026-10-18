import { describe, expect, it } from "vitest";

import { cn } from "./utils";

describe("cn", () => {
  it("keeps a text color next to a brand text size", () => {
    expect(cn("text-on-warm", "text-body-lg")).toBe("text-on-warm text-body-lg");
  });

  it("lets a later brand size replace an earlier one", () => {
    expect(cn("text-small", "text-h4")).toBe("text-h4");
  });

  it("lets a later brand shadow replace an earlier one", () => {
    expect(cn("shadow-panel", "shadow-dialog")).toBe("shadow-dialog");
  });
});
