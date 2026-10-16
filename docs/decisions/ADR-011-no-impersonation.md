# ADR-011: No admin impersonation

- **Status:** Accepted
- **Date:** 2026-10-16
- **Spec:** §4.3, §9

## Decision

Admins cannot log in as users.

## Alternatives considered

- A "log in as user" feature.

## Reason

Large security and trust risk. Read-only detail views cover support needs.

## Consequences

Support tooling must expose enough read-only detail to debug user issues without impersonation.
