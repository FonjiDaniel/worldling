import type { SuppressionScope } from "../shared/emailTemplates";
import { optionalEnv } from "../lib/env";
import { emailLayout as l, logoUrl } from "./templates/emailLayout";
import { emailColors as c, emailFonts as f, emailRadius as r } from "./templates/emailTheme";

// The small HTML pages behind unsubscribe links (SPEC §7.8). Served from Convex, so they
// can't use the app's CSS; values come from the generated email theme (same source as tokens).

const SCOPE_COPY: Record<SuppressionScope, string> = {
  all_non_security: "emails like this one",
  digest: "your weekly world digest",
  comet_alerts: "comet alerts",
  product: "product news",
};

function headers(siteUrl: string | undefined): Record<string, string> {
  const img = siteUrl === undefined ? "" : `; img-src ${new URL(siteUrl).origin}`;
  return {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
    "Referrer-Policy": "no-referrer",
    "X-Robots-Tag": "noindex",
    "Content-Security-Policy": `default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'${img}`,
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function page(status: number, title: string, body: string): Response {
  const siteUrl = optionalEnv("SITE_URL");
  const brand =
    siteUrl === undefined
      ? `<p class="brand">Worldling</p>`
      : `<img class="brand" src="${escapeHtml(logoUrl(siteUrl))}" width="${l.mobileLogoWidth}" alt="Worldling">`;
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark"><title>${title} · Worldling</title>
<style>
body{margin:0;min-height:100vh;display:grid;place-items:center;background:${c.void};color:${c.text};font-family:${f.sans};line-height:1.6}
main{max-width:28rem;margin:1rem;padding:1.5rem;background:${c.surface};border:1px solid ${c.line};border-radius:${r.lg}px}
.brand{display:block;height:auto;margin:0 0 1.5rem;font-weight:600}
h1{margin:0 0 .75rem;font-family:${f.display};font-size:1.75rem;font-weight:650;line-height:1.15;letter-spacing:-0.025em}
p{margin:0 0 1rem}.muted{color:${c["text-muted"]};font-size:.875rem}
button{min-height:3rem;padding:.75rem 1.5rem;border:0;border-radius:${r.full}px;background:${c.warm};color:${c["on-warm"]};font:inherit;font-weight:600;cursor:pointer}
button:focus-visible{outline:2px solid ${c.accent};outline-offset:3px}
</style></head>
<body><main>${brand}${body}</main></body></html>`;
  return new Response(html, { status, headers: headers(siteUrl) });
}

/** GET: asks before changing anything, so link scanners can't unsubscribe anyone. */
export function confirmPage(scope: SuppressionScope, actionUrl: string): Response {
  return page(
    200,
    "Unsubscribe",
    `<h1>Stop ${SCOPE_COPY[scope]}?</h1>
<p>We'll stop sending ${SCOPE_COPY[scope]} to this address.</p>
<form method="post" action="${escapeHtml(actionUrl)}"><button type="submit">Unsubscribe</button></form>`,
  );
}

export function donePage(scope: SuppressionScope): Response {
  return page(
    200,
    "Unsubscribed",
    `<h1 role="status">You're unsubscribed</h1>
<p>You won't get ${SCOPE_COPY[scope]} anymore.</p>
<p class="muted">We'll still send account and security emails, like sign-in codes. You can change this anytime in your settings.</p>`,
  );
}

export function invalidPage(): Response {
  return page(
    400,
    "Link expired",
    `<h1>This link has expired</h1>
<p>It may be old or incomplete. You can turn emails on or off anytime in your Worldling settings.</p>`,
  );
}
