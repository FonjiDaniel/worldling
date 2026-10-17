"use node";

import { render } from "@react-email/render";

import { type EmailTemplateKey, templateSubject } from "../../shared/emailTemplates";
import { componentFor } from "./index";

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

/** Renders validated `data` to HTML and plain text. `unsubscribeUrl` only for non-security mail. */
export async function renderEmail(
  key: EmailTemplateKey,
  data: unknown,
  unsubscribeUrl?: string,
): Promise<RenderedEmail> {
  const Component = componentFor(key);
  const element = <Component data={data} unsubscribeUrl={unsubscribeUrl} />;
  const [html, text] = await Promise.all([render(element), render(element, { plainText: true })]);
  return { subject: templateSubject(key, data), html, text };
}
