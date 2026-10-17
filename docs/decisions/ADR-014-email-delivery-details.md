# ADR-014: Email delivery details

- **Status:** Accepted
- **Date:** 2026-10-17
- **Spec:** §7.2, §7.5, §7.7, §7.8, §13.5

## Context

Phase 3 built the email pipeline from §7. §7 leaves a few things open: whether Gmail SMTP works from Convex Node actions (§7.5 asks to verify it), how SMTP status codes map to retry classes, how unsubscribe links survive link scanners, where template schemas live so V8 code can use them, and how tests send mail without a provider.

## Decision

- **Gmail SMTP on 465 works from Convex.** Verified on the dev deployment on 2026-10-17: an `admin.test` email sent through the env fallback (`smtp.gmail.com:465`, implicit TLS, app password) reached `sent` on the first attempt about 5 seconds after enqueue, with a Gmail message id. Gmail stays the launch transport. 587 STARTTLS was not needed.
- **Retry classes.** Retryable: network errors (`ETIMEDOUT`, `ECONNRESET`, `ECONNREFUSED`, `ESOCKET`, `EDNS`), SMTP 4xx (421 and 45x are transient in SMTP), HTTP 429 and 5xx. Permanent: `EAUTH`, `EENVELOPE`, `EMESSAGE`, `ETLS`, SMTP 5xx, other HTTP 4xx, no transport configured, missing or undecryptable secret. Failure reasons are short codes, never provider text.
- **Category comes from the template registry.** `enqueueEmail` takes `{ to, template, data, idempotencyKey }`. Callers can't mislabel a digest as security mail to skip suppressions.
- **Over-limit mail.** Security mail over `email.perRecipientSecurity` throws `RATE_LIMITED` so the UI can show a countdown. Non-security mail over `email.perRecipient` is stored as `cancelled` with `lastError: "rate_limited"`, so a digest never fails the mutation that sent it.
- **OTP data scrubbing.** Security rows get `data` set to null once they reach a final status, so codes and links don't stay in the database.
- **Shared template registry.** Keys, zod schemas, categories, subjects and `previewData` live in `convex/shared/emailTemplates.ts`. The React components and the renderer (`"use node"`) live in `convex/email/templates/`, so V8 mutations never bundle React Email.
- **Own email primitives.** `@react-email/components` is deprecated, and its successor pulls in CLI dependencies. We use `@react-email/render` with small table-based primitives in `templates/Layout.tsx`.
- **Resend via fetch.** No SDK. The outbox id is the `Idempotency-Key`.
- **Unsubscribe is GET-confirm, POST-act.** GET shows a confirm page and never writes, so link scanners can't unsubscribe anyone. POST (the page's button, and RFC 8058 one-click via `List-Unsubscribe-Post`) adds the suppression. Tokens are `base64url(claims).base64url(HMAC-SHA256)` with `EMAIL_LINK_SECRET`, a 1 year expiry, and URLs built from the built-in `CONVEX_SITE_URL`. Non-security mail is not sent at all without a link secret.
- **`EMAIL_FAKE=true`** routes mail to a fake provider for tests and local work. Recipients starting with `fail-permanent` or `fail-retry` trigger those failures. It is ignored when `APP_ENV=production`.

## Alternatives considered

- **SMTP 4xx as permanent:** would drop mail on Gmail's routine 421 throttling.
- **GET unsubscribes directly:** simplest, but security scanners that prefetch links would unsubscribe people.
- **Caller-supplied category:** what §7.2 shows, but it trusts the caller with a security decision.
- **Throwing for all over-limit mail:** a digest batch would fail on one busy recipient.

## Consequences

- Moving to Resend is an admin config change, not a deploy (§7.4).
- Gmail's ~500 recipients/day limit still applies. The admin overview flags it for gmail.com hosts.
- Last successful send and 24h failure counts on the admin page need rollups and come with Phase 10.
