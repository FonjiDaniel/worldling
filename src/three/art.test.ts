import { describe, expect, it } from "vitest";

import { toHex } from "./art";

describe("art tokens", () => {
  it("turns computed rgb() into hex", () => {
    expect(toHex("rgb(7, 7, 26)")).toBe("#07071a");
    expect(toHex("rgba(255, 244, 237, 1)")).toBe("#fff4ed");
    expect(toHex("none")).toBe("");
  });
});
