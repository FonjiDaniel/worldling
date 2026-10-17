import { z } from "zod";

// Email transport form rules (SPEC §7.4), shared by admin mutations and the Phase 10 form.
// Secrets are optional on update: leaving one out keeps the stored value.

const host = z
  .string()
  .trim()
  .min(1)
  .max(253)
  .regex(/^[a-z0-9.-]+$/i, "Use a host name like smtp.gmail.com");

export const emailConfigInputSchema = z
  .object({
    transport: z.enum(["smtp", "resend"]),
    fromName: z.string().trim().min(1).max(64),
    fromAddress: z.email().max(254),
    replyTo: z.email().max(254).optional(),
    smtp: z
      .object({
        host,
        port: z.int().min(1).max(65535),
        secure: z.boolean(),
        user: z.string().trim().min(1).max(254),
        password: z.string().min(1).max(512).optional(),
      })
      .optional(),
    resend: z.object({ apiKey: z.string().min(1).max(512).optional() }).optional(),
  })
  .refine((input) => (input.transport === "smtp" ? input.smtp : input.resend) !== undefined, {
    message: "Add the settings for this transport",
    path: ["transport"],
  });

export type EmailConfigInput = z.infer<typeof emailConfigInputSchema>;

/** Gmail allows about 500 recipients a day (SPEC §7.5), so the admin page warns about it. */
export function isGmailHost(host: string | undefined): boolean {
  return host !== undefined && /(^|\.)(gmail|googlemail)\.com$/i.test(host.trim());
}
