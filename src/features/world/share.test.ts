import { describe, expect, it } from "vitest";

import { sharePayload, shareTargets } from "./share";

const base = { siteUrl: "https://worldling.app", username: "mira", worldName: "Éclats d’aurore" };

describe("sharePayload", () => {
  it("builds a clean world link with owner and visitor text", () => {
    expect(sharePayload({ ...base, isOwner: true })).toEqual({
      title: "Éclats d’aurore",
      text: "Come visit Éclats d’aurore, my world on Worldling.",
      url: "https://worldling.app/w/mira",
    });
    expect(sharePayload({ ...base, isOwner: false }).text).toBe(
      "Visit Éclats d’aurore on Worldling.",
    );
  });

  it("ignores a trailing slash or path on the site URL", () => {
    expect(sharePayload({ ...base, siteUrl: "https://worldling.app/x/", isOwner: false }).url).toBe(
      "https://worldling.app/w/mira",
    );
  });
});

describe("shareTargets", () => {
  it("encodes the text and link for each network", () => {
    const targets = shareTargets(sharePayload({ ...base, isOwner: false }));
    expect(targets.map((target) => target.name)).toEqual(["WhatsApp", "X", "Facebook", "Telegram"]);
    for (const { href } of targets) {
      expect(href).toContain(encodeURIComponent("https://worldling.app/w/mira"));
      expect(href).not.toMatch(/utm_/);
    }
  });
});
