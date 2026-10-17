// @vitest-environment node
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  EMAIL_TEMPLATE_KEYS,
  parseTemplateData,
  templateCategory,
  templatePreviewData,
} from "../../shared/emailTemplates";
import { renderEmail } from "./render";
import { emailColors } from "./theme";

const EM_DASH = "—";
const UNSUBSCRIBE = "https://example.convex.site/email/unsubscribe?t=abc";

describe("email templates", () => {
  it.each(EMAIL_TEMPLATE_KEYS)("%s preview data passes its own schema", (key) => {
    expect(parseTemplateData(key, templatePreviewData(key)).ok).toBe(true);
  });

  it.each(EMAIL_TEMPLATE_KEYS)("%s renders html, text and a subject", async (key) => {
    const email = await renderEmail(key, templatePreviewData(key), UNSUBSCRIBE);
    expect(email.subject.length).toBeGreaterThan(0);
    expect(email.html).toContain('content="dark"');
    expect(email.text.length).toBeGreaterThan(20);
    expect(email.text).not.toContain("<");
    for (const part of [email.subject, email.html, email.text]) {
      expect(part).not.toContain(EM_DASH);
    }
  });

  it.each(EMAIL_TEMPLATE_KEYS)("%s shows the unsubscribe link only when given", async (key) => {
    const withLink = await renderEmail(key, templatePreviewData(key), UNSUBSCRIBE);
    const withoutLink = await renderEmail(key, templatePreviewData(key));
    expect(withoutLink.html).not.toContain("Unsubscribe");
    if (templateCategory(key) !== "security") {
      expect(withLink.html).toContain("Unsubscribe from these emails");
    }
  });

  it("puts the code in the verification email text", async () => {
    const email = await renderEmail("auth.verify", { code: "482913", minutes: 15 });
    expect(email.text).toContain("482913");
  });

  it("rejects data that does not match the schema", () => {
    const parsed = parseTemplateData("account.welcome", { displayName: "", worldUrl: "nope" });
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(Object.keys(parsed.fieldErrors)).toContain("worldUrl");
  });
});

describe("email theme", () => {
  const tokens = readFileSync("src/styles/tokens.css", "utf8");

  it.each(Object.entries(emailColors))("%s matches the CSS token", (name, value) => {
    const match = new RegExp(`--color-${name}:\\s*(#[0-9a-f]{6});`, "i").exec(tokens);
    expect(match?.[1]?.toLowerCase()).toBe(value);
  });
});
