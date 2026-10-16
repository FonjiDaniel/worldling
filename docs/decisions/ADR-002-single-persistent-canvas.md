# ADR-002: One persistent WebGL canvas

- **Status:** Accepted
- **Date:** 2026-10-16
- **Spec:** §4.3, §8.1

## Decision

The whole app uses one persistent canvas (`src/three/ExperienceRoot.tsx`). Scenes render through drei `<View>`.

## Alternatives considered

- A new `<Canvas>` per page.

## Reason

Browsers cap WebGL contexts, re-creating contexts is slow and leaks memory, and a persistent canvas allows seamless page transitions.

## Consequences

No feature may add another `<Canvas>`. Scene lifecycles and disposal must be managed carefully because the context outlives pages.
