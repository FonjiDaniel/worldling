# ADR-007: Email via outbox, workpool and provider adapters

- **Status:** Accepted
- **Date:** 2026-10-16
- **Spec:** §4.3, §7

## Decision

Email goes through an outbox table, a workpool and provider adapters. Provider config lives in the database, and secrets are encrypted with AES-256-GCM.

## Alternatives considered

- Hard-coded provider.
- Plaintext secrets.
- The Convex Resend component only.

## Reason

An admin can switch Gmail to Resend without a deploy, every email is logged and retries are safe.

## Consequences

Needs `SECRETS_ENCRYPTION_KEY` with key versioning, and a fake provider for tests.
