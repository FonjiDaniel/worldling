# ADR-004: Thin Convex functions, logic in model

- **Status:** Accepted
- **Date:** 2026-10-16
- **Spec:** §4.3, §5.1

## Decision

Convex handlers stay thin (about 30 lines). Business logic lives in `convex/model/*`.

## Alternatives considered

- Fat handlers with logic inline.

## Reason

Testable, reusable, one place per rule.

## Consequences

Model functions take `ctx` plus typed inputs and are unit tested through `convex-test`.
