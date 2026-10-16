import { describe, expect, it } from "vitest";

import { countGraphemes } from "./graphemes";

describe("countGraphemes", () => {
  it("counts plain text by character", () => {
    expect(countGraphemes("tend")).toBe(4);
    expect(countGraphemes("")).toBe(0);
  });

  it("counts an emoji sequence as one", () => {
    expect(countGraphemes("👩‍🚀")).toBe(1);
    expect(countGraphemes("🇨🇲!")).toBe(2);
  });

  it("counts a combining accent as part of its letter", () => {
    expect(countGraphemes("é")).toBe(1);
  });
});
