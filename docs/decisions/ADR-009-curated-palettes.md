# ADR-009: Curated palettes, clamped custom colors

- **Status:** Accepted
- **Date:** 2026-10-16
- **Spec:** §4.3, §2.3, §3.8

## Decision

Worlds use curated palettes by default. Custom colors are clamped to safe ranges.

## Alternatives considered

- Free color pickers.

## Reason

Every world looks good, which protects the wow moment and the share images.

## Consequences

Clamps live in `convex/shared/worldParams.ts` and run on both client and server.
