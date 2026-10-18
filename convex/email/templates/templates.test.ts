// @vitest-environment node
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  EMAIL_TEMPLATE_KEYS,
  parseTemplateData,
  templateCategory,
  templatePreviewData,
} from "../../shared/emailTemplates";
import { renderEmail } from "./render";

const EM_DASH = "—";
const SITE = { siteUrl: "https://worldling.test" };
const UNSUBSCRIBE = "https://example.convex.site/email/unsubscribe?t=abc";
const LOGO = "https://worldling.test/brand/email/worldling-horizontal-on-dark@2x.png";

describe("email templates", () => {
  it.each(EMAIL_TEMPLATE_KEYS)("%s preview data passes its own schema", (key) => {
    expect(parseTemplateData(key, templatePreviewData(key)).ok).toBe(true);
  });

  it.each(EMAIL_TEMPLATE_KEYS)("%s renders html, text and a subject", async (key) => {
    const email = await renderEmail(key, templatePreviewData(key), {
      ...SITE,
      unsubscribeUrl: UNSUBSCRIBE,
    });
    expect(email.subject.length).toBeGreaterThan(0);
    expect(email.html).toContain('content="dark"');
    expect(email.text.length).toBeGreaterThan(20);
    expect(email.text).not.toContain("<");
    for (const part of [email.subject, email.html, email.text]) {
      expect(part).not.toContain(EM_DASH);
    }
  });

  it.each(EMAIL_TEMPLATE_KEYS)("%s uses the 06 header and footer", async (key) => {
    const { html } = await renderEmail(key, templatePreviewData(key), SITE);
    expect(html).toContain(`src="${LOGO}"`);
    expect(html).toContain('alt="Worldling"');
    expect(html).toContain("Visit everyone else&#x27;s.");
    expect(html).toContain('href="https://worldling.test/settings"');
  });

  it.each(EMAIL_TEMPLATE_KEYS)("%s shows the unsubscribe link only when given", async (key) => {
    const withLink = await renderEmail(key, templatePreviewData(key), {
      ...SITE,
      unsubscribeUrl: UNSUBSCRIBE,
    });
    const withoutLink = await renderEmail(key, templatePreviewData(key), SITE);
    expect(withoutLink.html).not.toContain("Unsubscribe");
    if (templateCategory(key) !== "security") {
      expect(withLink.html).toContain(`href="${UNSUBSCRIBE.replace("&", "&amp;")}"`);
      expect(withLink.html).toMatch(/>Unsubscribe<\/a>/);
    }
  });

  it("puts the code in the verification email text", async () => {
    const email = await renderEmail("auth.verify", { code: "482913", minutes: 15 }, SITE);
    expect(email.text).toContain("482913");
  });

  it("rejects data that does not match the schema", () => {
    const parsed = parseTemplateData("account.welcome", { displayName: "", worldUrl: "nope" });
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(Object.keys(parsed.fieldErrors)).toContain("worldUrl");
  });
});

describe("email theme", () => {
  it("is generated from the same brand tokens as tokens.css", () => {
    expect(() =>
      execFileSync(process.execPath, ["scripts/build-tokens.mjs", "--check"], { stdio: "pipe" }),
    ).not.toThrow();
  });

  it("keeps hex colors out of templates (they come from emailTheme.ts)", () => {
    const dir = "convex/email/templates";
    const files = readdirSync(dir).filter(
      (name) => /\.tsx?$/.test(name) && name !== "emailTheme.ts" && !name.includes(".test."),
    );
    const offenders = files.filter((name) =>
      /#[0-9a-f]{3,8}\b/i.test(readFileSync(`${dir}/${name}`, "utf8")),
    );
    expect(offenders).toEqual([]);
  });
});
