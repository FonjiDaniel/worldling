"use node";

import type { ActionCtx } from "../_generated/server";
import { internal } from "../_generated/api";
import { optionalEnv } from "../lib/env";
import {
  type EmailTemplateKey,
  templateCategory,
  unsubscribeScopeFor,
} from "../shared/emailTemplates";
import { resolveDbConfig } from "./config";
import { envEmailConfig } from "./envConfig";
import { EmailSendError } from "./errors";
import { unsubscribeUrl } from "./links";
import { renderEmail } from "./templates/render";
import { formatFrom, type OutgoingEmail, type ResolvedConfig } from "./types";

// Builds a ready-to-send message: active config (or env fallback), rendered template and,
// for non-security mail, List-Unsubscribe headers (SPEC §7.2, §7.8).

/** The active DB config, else the env fallback. No transport at all is a permanent failure. */
export async function loadActiveConfig(ctx: Pick<ActionCtx, "runQuery">): Promise<ResolvedConfig> {
  const active = await ctx.runQuery(internal.email.config.activeConfig, {});
  if (active !== null) return await resolveDbConfig(active);
  const fallback = envEmailConfig();
  if (fallback === null) throw new EmailSendError("permanent", "no_transport");
  return fallback;
}

interface ComposeInput {
  to: string;
  template: EmailTemplateKey;
  data: unknown;
  idempotencyKey?: string;
}

export async function composeEmail(
  config: ResolvedConfig,
  input: ComposeInput,
): Promise<OutgoingEmail> {
  const { to, template } = input;
  let link: string | undefined;
  if (templateCategory(template) !== "security") {
    link = await unsubscribeLink(to, template);
  }
  const rendered = await renderEmail(template, input.data, {
    siteUrl: siteUrl(),
    ...(link !== undefined && { unsubscribeUrl: link }),
  });
  return {
    from: formatFrom(config.fromName, config.fromAddress),
    to,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    ...(config.replyTo !== undefined && { replyTo: config.replyTo }),
    ...(input.idempotencyKey !== undefined && { idempotencyKey: input.idempotencyKey }),
    ...(link !== undefined && {
      headers: {
        "List-Unsubscribe": `<${link}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    }),
  };
}

/** The logo and preference links need an absolute origin, so mail never goes out without one. */
function siteUrl(): string {
  const value = optionalEnv("SITE_URL");
  if (value === undefined) throw new EmailSendError("permanent", "missing_site_url");
  return value;
}

async function unsubscribeLink(to: string, template: EmailTemplateKey): Promise<string> {
  try {
    return await unsubscribeUrl({ email: to, scope: unsubscribeScopeFor(template) }, Date.now());
  } catch {
    // Never send non-security mail without a working unsubscribe link.
    throw new EmailSendError("permanent", "missing_link_secret");
  }
}
