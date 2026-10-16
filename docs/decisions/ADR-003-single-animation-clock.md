# ADR-003: Single animation clock

- **Status:** Accepted
- **Date:** 2026-10-16
- **Spec:** §4.3, §8.1

## Decision

`gsap.ticker` drives Lenis and R3F (`frameloop="never"` plus `advance`).

## Alternatives considered

- Three separate requestAnimationFrame loops.

## Reason

No jitter between scroll, camera and render.

## Consequences

If a drei feature misbehaves under manual advance, fall back to the R3F default loop for that case and record it in a new ADR.
