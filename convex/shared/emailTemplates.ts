import { z } from "zod";

// Email template definitions shared by enqueue (V8), rendering (Node) and the admin preview
// (SPEC §7.7). The React components live in convex/email/templates and import these.

export type EmailCategory = "security" | "transactional" | "digest" | "product";
export type SuppressionScope = "all_non_security" | "digest" | "comet_alerts" | "product";

interface TemplateDefinition<S extends z.ZodType> {
  category: EmailCategory;
  /** The narrow suppression scope that also blocks this template, besides all_non_security. */
  scope?: Exclude<SuppressionScope, "all_non_security">;
  schema: S;
  subject: (data: z.infer<S>) => string;
  previewData: z.infer<S>;
}

function define<S extends z.ZodType>(definition: TemplateDefinition<S>): TemplateDefinition<S> {
  return definition;
}

const name = z.string().trim().min(1).max(64);
const url = z.url({ protocol: /^https?$/ });
const otp = z.object({
  code: z.string().regex(/^[0-9A-Za-z]{4,12}$/),
  minutes: z.int().min(1).max(120),
});

export const EMAIL_TEMPLATES = {
  "auth.verify": define({
    category: "security",
    schema: otp,
    subject: () => "Your Worldling verification code",
    previewData: { code: "482913", minutes: 15 },
  }),
  "auth.reset": define({
    category: "security",
    schema: otp,
    subject: () => "Reset your Worldling password",
    previewData: { code: "730154", minutes: 15 },
  }),
  "account.welcome": define({
    category: "transactional",
    schema: z.object({ displayName: name, worldName: name, worldUrl: url }),
    subject: () => "Your little corner of the universe",
    previewData: {
      displayName: "Kai",
      worldName: "Mossbright",
      worldUrl: "https://worldling.app/w/kai",
    },
  }),
  "account.export": define({
    category: "security",
    schema: z.object({ downloadUrl: url, hours: z.int().min(1).max(168) }),
    subject: () => "Your Worldling data is ready",
    previewData: { downloadUrl: "https://worldling.app/export/preview", hours: 24 },
  }),
  "account.deleted": define({
    category: "security",
    schema: z.object({ displayName: name }),
    subject: () => "Your Worldling account is deleted",
    previewData: { displayName: "Kai" },
  }),
  "comets.alert": define({
    category: "digest",
    scope: "comet_alerts",
    schema: z.object({
      displayName: name,
      worldName: name,
      worldUrl: url,
      count: z.int().min(1),
      comets: z
        .array(z.object({ from: name, text: z.string().max(280) }))
        .min(1)
        .max(5),
    }),
    subject: (data) =>
      data.count === 1
        ? "A comet landed on your world"
        : `${data.count} comets landed on your world`,
    previewData: {
      displayName: "Kai",
      worldName: "Mossbright",
      worldUrl: "https://worldling.app/w/kai",
      count: 2,
      comets: [
        { from: "Ana", text: "Your moon is the softest thing I have seen today." },
        { from: "Tomi", text: "Came back to see the rings again." },
      ],
    },
  }),
  "digest.weekly": define({
    category: "digest",
    scope: "digest",
    schema: z.object({
      displayName: name,
      worldName: name,
      worldUrl: url,
      visits: z.int().min(0),
      comets: z.int().min(0),
      level: z.int().min(1),
      streak: z.int().min(0),
    }),
    subject: (data) => `Your week on ${data.worldName}`,
    previewData: {
      displayName: "Kai",
      worldName: "Mossbright",
      worldUrl: "https://worldling.app/w/kai",
      visits: 42,
      comets: 7,
      level: 4,
      streak: 5,
    },
  }),
  "admin.test": define({
    category: "security",
    schema: z.object({ transport: z.enum(["smtp", "resend"]), source: z.enum(["db", "env"]) }),
    subject: () => "Worldling test email",
    previewData: { transport: "smtp", source: "db" },
  }),
};

export type EmailTemplateKey = keyof typeof EMAIL_TEMPLATES;
export type EmailTemplateData<K extends EmailTemplateKey> = z.infer<
  (typeof EMAIL_TEMPLATES)[K]["schema"]
>;

export const EMAIL_TEMPLATE_KEYS = Object.keys(EMAIL_TEMPLATES) as EmailTemplateKey[];

export function isEmailTemplateKey(value: string): value is EmailTemplateKey {
  return Object.hasOwn(EMAIL_TEMPLATES, value);
}

// Widened so generic code (enqueue, render, preview) can work with any key.
function definitionOf(key: EmailTemplateKey): TemplateDefinition<z.ZodType> {
  return EMAIL_TEMPLATES[key];
}

export type ParsedTemplateData =
  { ok: true; data: unknown } | { ok: false; fieldErrors: Record<string, string[]> };

/** Validates `data` with the template's schema. */
export function parseTemplateData(key: EmailTemplateKey, data: unknown): ParsedTemplateData {
  const result = definitionOf(key).schema.safeParse(data);
  if (result.success) return { ok: true, data: result.data };
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join(".") || "data";
    (fieldErrors[path] ??= []).push(issue.message);
  }
  return { ok: false, fieldErrors };
}

export function templateCategory(key: EmailTemplateKey): EmailCategory {
  return definitionOf(key).category;
}

/** Subject line for already validated data. */
export function templateSubject(key: EmailTemplateKey, data: unknown): string {
  return definitionOf(key).subject(data);
}

export function templatePreviewData(key: EmailTemplateKey): unknown {
  return definitionOf(key).previewData;
}

/** Whether a suppression with `scope` blocks `template`. Security mail is never suppressed. */
export function isSuppressedBy(template: EmailTemplateKey, scope: SuppressionScope): boolean {
  const definition = definitionOf(template);
  if (definition.category === "security") return false;
  return scope === "all_non_security" || definition.scope === scope;
}

/** The scope an unsubscribe link in `template` turns off. */
export function unsubscribeScopeFor(template: EmailTemplateKey): SuppressionScope {
  return definitionOf(template).scope ?? "all_non_security";
}
