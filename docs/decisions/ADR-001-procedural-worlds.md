# ADR-001: Worlds are procedural

- **Status:** Accepted
- **Date:** 2026-10-16
- **Spec:** §4.3, §2.3, §8.3

## Decision

Worlds are stored as a small set of parameters and rendered by shaders on the client.

## Alternatives considered

- Storing baked textures or meshes per world.

## Reason

Tiny payloads (under 1KB per world), infinite variety, instant edits and no CDN costs.

## Consequences

The parameter schema in `convex/shared/worldParams.ts` is the contract between client and server. Rendering must be deterministic from parameters, and share images need a capture step (§8.7).
