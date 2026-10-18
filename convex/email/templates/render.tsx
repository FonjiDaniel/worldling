"use node";

import { render } from "@react-email/render";

import { type EmailTemplateKey, templateSubject } from "../../shared/emailTemplates";
import { componentFor } from "./index";

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export interface RenderOptions {
  /** The app's public origin (SITE_URL). The logo and preference links are built from it. */
  siteUrl: string;
  /** Only for non-security mail. */
  unsubscribeUrl?: string;
}

/** Renders validated `data` to HTML and plain text. */
export async function renderEmail(
  key: EmailTemplateKey,
  data: unknown,
  { siteUrl, unsubscribeUrl }: RenderOptions,
): Promise<RenderedEmail> {
  const Component = componentFor(key);
  const element = <Component data={data} siteUrl={siteUrl} unsubscribeUrl={unsubscribeUrl} />;
  const [html, text] = await Promise.all([render(element), render(element, { plainText: true })]);
  return { subject: templateSubject(key, data), html, text };
}
