# ADR-012: Universe data streamed by sector

- **Status:** Accepted
- **Date:** 2026-10-16
- **Spec:** §4.3, §8.4

## Decision

Universe data is streamed by galaxy sector around the camera.

## Alternatives considered

- Subscribing to all worlds.

## Reason

Scales to 100k+ worlds with bounded bandwidth and memory.

## Consequences

Needs sector keys (`convex/shared/galaxy.ts`), an index by sector, and LOD on the client.
