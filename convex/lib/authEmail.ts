import { Email } from "@convex-dev/auth/providers/Email";

import { internal } from "../_generated/api";
import type { ActionCtx } from "../_generated/server";
import type { EmailTemplateKey } from "../shared/emailTemplates";
import { OTP_LENGTH, OTP_MINUTES } from "../shared/otp";

// OTP email providers for the Password flows (SPEC §6.1, §6.2, ADR-015). Codes never leave
// through SMTP or Resend here: they go into our outbox like every other email.

/** Uniform random digits from Web Crypto. Bytes >= 250 are rejected so every digit is equally likely. */
export function generateOtp(length = OTP_LENGTH): string {
  const digits: number[] = [];
  const buffer = new Uint8Array(length * 2);
  while (digits.length < length) {
    crypto.getRandomValues(buffer);
    for (const byte of buffer) {
      if (byte < 250 && digits.length < length) digits.push(byte % 10);
    }
  }
  return digits.join("");
}

// Convex Auth passes its ActionCtx as a second argument that the Auth.js type leaves out.
function actionCtxOf(value: unknown): ActionCtx {
  if (typeof value === "object" && value !== null && "runMutation" in value) {
    return value as ActionCtx;
  }
  throw new Error("Convex Auth did not pass an action context to sendVerificationRequest");
}

function otpProvider(
  id: string,
  template: Extract<EmailTemplateKey, "auth.verify" | "auth.reset">,
) {
  return Email({
    id,
    maxAge: OTP_MINUTES * 60,
    generateVerificationToken: () => Promise.resolve(generateOtp()),
    sendVerificationRequest: async ({ identifier, token }, ...rest: unknown[]) => {
      const ctx = actionCtxOf(rest[0]);
      await ctx.runMutation(internal.email.outbox.enqueue, {
        to: identifier,
        template,
        data: { code: token, minutes: OTP_MINUTES },
        // Never derived from the code: this key stays on the row after the data is scrubbed.
        idempotencyKey: `${template}:${crypto.randomUUID()}`,
      });
    },
  });
}

export const verifyEmailProvider = otpProvider("password-verify", "auth.verify");
export const resetEmailProvider = otpProvider("password-reset", "auth.reset");
