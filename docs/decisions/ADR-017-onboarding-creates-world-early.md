# ADR-017: Onboarding creates the world before the renderer and universe phases

- **Status:** Accepted
- **Date:** 2026-10-17
- **Spec:** §6.3, §8.4, §15 (Phases 4, 5, 6, 8)

## Context

§6.3 says `completeOnboarding` creates the profile and the world, allocates a galaxy slot and enqueues the welcome email in one transaction. The pieces it needs are scheduled later: `shared/worldParams.ts` in Phase 5 and `shared/galaxy.ts` with slot allocation in Phase 8. Phase 4 had to either skip the world or pull those pieces forward.

## Decision

Pull forward minimal, final-shaped versions (agreed with the project owner on 2026-10-17):

- `shared/worldParams.ts`: zod schema mirroring `worldParamsV1`, clamping instead of rejecting numbers, one palette per biome, `randomParams(seed)`, `randomWorldName(seed)` and `worldNameSchema`. Phase 5 adds the curated palettes (18+), tuning and `describeWorld`.
- `shared/galaxy.ts`: `slotToPosition` and `sectorKeyFor` exactly as §8.4, plus `sectorKeyForSlot`. Phase 8 adds the streaming helpers.
- `shared/random.ts`: seeded PRNG and helpers shared by both.
- `model/worlds.ts`: `allocateSlot` (the `galaxy` singleton) and `createPrimaryWorld`, reused by `worlds.create` in Phase 6.
- `completeOnboarding` accepts an optional `{ name, params }` draft now. Phase 6 wires the claim flow from `/create`.

## Alternatives considered

- **Profile only in Phase 4, world in Phase 6:** onboarded accounts without a world, a welcome email with no world to link, and §6.3's single transaction split across phases.

## Consequences

- Every onboarded account has a world with a stable slot from day one, so slots never need backfilling.
- Phases 5 and 8 extend these modules rather than create them; their §15 entries say so.
- Phase 5 may change palette stops. Worlds store their own stops, so existing worlds keep their colors.
