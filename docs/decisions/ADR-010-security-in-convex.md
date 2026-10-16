# ADR-010: Security enforced in Convex

- **Status:** Accepted
- **Date:** 2026-10-16
- **Spec:** §4.3, §11, §6.5

## Decision

Security is enforced in Convex. Next.js checks (`proxy.ts`, layouts) are UX only.

## Alternatives considered

- Relying on `proxy.ts` or layouts for access control.

## Reason

Any client can call Convex directly, so Convex is the real boundary.

## Consequences

Every public function authorizes through its wrapper. Next.js redirects exist only to avoid showing screens a user cannot use.
