# ADR-008: Env-based fallback email config

- **Status:** Accepted
- **Date:** 2026-10-16
- **Spec:** §4.3, §7.5

## Decision

An env-based email config is used when no active config exists in the database.

## Alternatives considered

- Database-only config.

## Reason

Solves bootstrap: the first admin must verify their email before any admin can configure email.

## Consequences

Env fallback variables (§13.5) must be set on new deployments. The active source is visible to admins.
