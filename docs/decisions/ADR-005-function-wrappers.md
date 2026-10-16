# ADR-005: Custom wrappers for all public Convex functions

- **Status:** Accepted
- **Date:** 2026-10-16
- **Spec:** §4.3, §5.3

## Decision

All public Convex functions go through wrappers in `convex/lib/functions.ts` (`publicQuery`, `userMutation`, `staffMutation`, `adminMutation` and friends).

## Alternatives considered

- Ad hoc auth checks in each handler.

## Reason

Auth, suspension, maintenance mode and logging can never be forgotten.

## Consequences

Raw `query`/`mutation`/`action` are allowed only for internal functions. Lint or review must catch violations.
