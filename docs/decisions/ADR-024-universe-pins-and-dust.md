# ADR-024: Universe pins, slot dust and galaxy navigation

- **Status:** Accepted
- **Date:** 2026-10-19
- **Spec:** §2.5, §3.8, §4.3, §5.2, §5.5, §5.6, §8.4, §8.5

## Context

Phase 8 builds the universe. Three things in the spec don't hold up at 10k+ worlds or leave gaps:

- `universe.sectors` built on `worlds` re-runs whenever any world in the sector changes. `jobs.bloomProcessor` patches `worlds.bloom` every minute, so every viewer of a busy sector would get about 130 pins (plus 130 profile lookups for usernames) again each minute, only because some XP moved.
- Streaming only the 9 sectors around the camera (ADR-012) means a zoomed-out camera sees a 360-unit patch of a galaxy that is already 1200 units wide at 10k worlds. The rest of the spiral is missing.
- §5.5 has no way to find a world by username (§2.5 search) or to page through every world (§2.5 list mode).

The brand (05) also says stars are static ("no flashing stars"), while §3.8 asks for "sparse twinkling stars".

## Decision

- **`worldPins` table**: a denormalized, render-ready copy of each public world with an active owner. Its fields are `worldId`, `ownerId`, `slot`, `sectorKey`, `name`, `username`, `colorA`, `colorB`, `level`, `thumbnailId?` and `description`, with indexes `by_sector_slot`, `by_slot`, `by_world` and `by_owner`. `syncWorldPin(ctx, worldId)` in `model/pins.ts` upserts the pin when the world is public and its owner active, and deletes it otherwise.
  - Call sites today are `createPrimaryWorld`, `updateWorld`, `setThumbnail`, and the bloom processor only when the level changes.
  - Every later writer that changes visibility, owner status, name, username or level must call it too: moderation hide, suspension, account deletion (Phases 9 to 11).
  - `colorA` and `colorB` come from `pinColors(params)` in `shared/pins.ts`.
- **Lean sector pins.** `universe.sectors` returns `{ id, slot, name, username, colorA, colorB, level }`. Thumbnail URLs are only resolved where they are shown: list mode, search, featured and just born.
- **New queries** (all `publicQuery`):
  - `universe.overview` returns `{ slotCount, live }`. It is the galaxy's slot count plus the `universe.live` flag, which gates the live "just born" toast.
  - `universe.search` is a username prefix search over `profiles.by_username` that returns at most 6 pins.
  - `universe.list` pages through pins, newest first, with descriptions for list mode.
- **Slot dust.** Positions come from the slot alone, so the client draws every slot from 0 to `slotCount` as one faint `Points` layer. Slots in loaded sectors take their pin's colors, and slots with no pin there (hidden or deleted worlds) fade out. The dust reveals nothing beyond "a slot was taken".
- **Featured and just born are precomputed**, as §5.6 says. `jobs.rollups.trending` (hourly) writes world ids into the `universe.featured` and `universe.justBorn` settings keys through `setSystemSetting`, a job-only writer with no audit row because no person acted. Live births come from the sector subscriptions, not from the just born list.
- **Static stars.** The brand decides motion feel; §3.8 now reads "sparse, still stars".
- **Screen-space picking.** Hover and click project the loaded pins (at most about 1,200) into screen space and take the nearest one inside a radius. This replaces a GPU raycast over 10k instanced points, and it uses no per-frame allocations.
- **Tab cycling releases focus.** With the galaxy focused, Tab and Shift+Tab move through the 8 nearest worlds. One more Tab moves focus on to the next control, so there is no keyboard trap (WCAG 2.1.2).

## Alternatives considered

- **Reading `worlds` in `universe.sectors`:** no schema change, but subscriptions churn on every XP tick and each read doubles for profile lookups.
- **Storing `colorA`/`colorB` on `worlds`:** still churns, and usernames would still need a join.
- **Only rendering loaded sectors:** follows §8.4 literally, but the galaxy looks cut off when zoomed out.
- **Computing just born live (`by_slot` desc):** every signup would invalidate every viewer's subscription, and §5.6 already plans an hourly list.

## Consequences

- One more table to keep in sync. A unit test (`convex/universe.test.ts`) checks each sync point. Phase 9 to 11 writers must call `syncWorldPin`, so this ADR is linked from `model/pins.ts`.
- Bloom XP alone never touches pins, so sector subscriptions only change when something visible changes.
- Featured and just born can be up to an hour old. That's fine for a discovery rail.
