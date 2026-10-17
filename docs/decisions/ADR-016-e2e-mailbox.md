# ADR-016: E2E mailbox for auth codes

- **Status:** Accepted
- **Date:** 2026-10-17
- **Spec:** §13.1, §7.2, §7.5

## Context

The Phase 4 acceptance test signs up, verifies with the emailed code and onboards in a real browser. The dev deployment sends real mail through Gmail SMTP, and security rows in the outbox have their `data` scrubbed once sent (ADR-014), so Playwright has nowhere to read the code from. Convex Auth stores only a hash of the code.

## Decision

- Recipients on `@e2e.worldling.test` (a reserved `.test` domain that can never receive mail) are e2e recipients, but only when `APP_ENV` is explicitly `development`, `preview` or `test`. An unset `APP_ENV` counts as production for this check.
- For e2e recipients, `email/dispatch.ts` uses the fake provider and, after the send, calls `internal.testing.e2e.record`, which stores `{ to, template, data }` in the `e2eMailbox` table. Everything else in the pipeline is real: enqueue, rate limits, workpool, rendering, scrubbing of the outbox row.
- Playwright reads with `npx convex run testing/e2e:takeLatestEmail '{"to":"..."}'`, which returns the newest message and deletes it. Both functions are internal (deploy credentials needed) and both throw when the mailbox is disabled.

## Alternatives considered

- **Read a real Gmail inbox over IMAP:** slow, flaky, and needs another set of secrets in CI.
- **Skip scrubbing for test recipients:** keeps codes in the outbox, the very table ADR-014 cleans, and still needs a reader.
- **A fixed code in test mode:** a backdoor waiting to be misconfigured in production.

## Consequences

- E2E needs a non-production Convex deployment and the CLI logged in to it (`npx convex dev` locally, a deploy key in CI).
- The `e2eMailbox` table exists in production but stays empty; a test asserts both functions refuse when `APP_ENV=production`.
- `jobs.cleanup` (Phase 10) should also drop e2e mailbox rows older than a day, in case a test run dies before reading.
