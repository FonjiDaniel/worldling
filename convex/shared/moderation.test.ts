import { describe, expect, it } from "vitest";

import { checkText } from "./moderation";

describe("checkText", () => {
  it("passes kind text", () => {
    expect(checkText("What a lovely world, the clouds are dreamy")).toEqual({ ok: true });
    expect(checkText("Visited 3 times today")).toEqual({ ok: true });
  });

  it.each([
    ["https://example.com", "link"],
    ["go to www.example.org", "link"],
    ["see spam.io now", "link"],
    ["mail me at kai@example.com", "email"],
    ["call +1 (555) 123-4567", "phone"],
    ["text 5551234567", "phone"],
    ["you are a fucking star", "profanity"],
    ["f u c k", "profanity"],
  ] as const)("flags %j as %s", (text, kind) => {
    expect(checkText(text)).toEqual({ ok: false, kind });
  });

  it("matches extra words through spacing and punctuation", () => {
    expect(checkText("you g-r-u-m-b-l-e", ["grumble"])).toEqual({ ok: false, kind: "profanity" });
    expect(checkText("no problem here", ["", "grumble"])).toEqual({ ok: true });
  });
});
