# ADR-023: Bloom caps, tend markers and the Phase 7 world page

- **Status:** Accepted
- **Date:** 2026-10-19
- **Spec:** §2.2 (Visit, Return), §2.4, §5.2, §5.6, §5.7, §12

## Context

§2.4 caps comet XP at "one counted per author per world per day", but `worldStatsDaily` only holds totals, and the processor runs in batches, so it can't tell a second comet from the same author in a later batch. §5.7 also asks `tend` to check a unique index before inserting, and `bloomQueue` has none. The streak bonus ("+1 per consecutive day, max +5") doesn't say whether day 1 already earns +1. 07 has level-up copy only for moons. And the 06 mockup's main button is "Send a comet", which Phase 9 builds.

## Decision

- **`worldStatsDaily.cometAuthors`** (optional array of user ids): the authors whose comet earned XP that day. It stops growing at the cap (10), so the row stays small. The processor checks it across batches.
- **Tend markers reuse `worldVisits`.** A tend inserts the owner's own `worldVisits` row for the day, using the existing `by_world_visitor_day` index for idempotency. Visits never count the owner, so the rows don't mix. The processor also skips a tend when `bloom.lastTendedDay` is that day.
- **Streak bonus = min(streak - 1, 5).** Day 1 of a streak earns the plain +10, day 2 earns +11, day 6 and later +15. A gap resets the streak to 1. XP is never lost.
- **Visits** count only verified accounts that aren't the owner and aren't blocked by the owner. Ineligible visits are not recorded at all.
- **Level-up copy** lives in `convex/shared/bloomCopy.ts`. Moon levels use 07 `celebrations.new_moon`; the others follow its pattern (name the visible change, no scores). The owner sees the message once per device (`worldling:bloomSeen:v1`); the `level_up` notification row serves the Phase 9 notifications page.
- **Rows for hidden or missing worlds are dropped**, not kept for later.
- **Until Phase 9, the world page's main button is share** ("Share my world" / "Share this world"). Phase 9 puts "Send a comet" there and moves share to the secondary row (agreed with the project owner on 2026-10-19).
- **OG fonts are static instances.** Satori renders only the default instance of a variable font, so `src/assets/fonts/` holds Bricolage Grotesque at 650 and Geist at 400 and 600, instanced from the 04 variable files.

## Alternatives considered

- **Dedupe comet authors at enqueue time (Phase 9):** needs a per-day comet index and still races between two sends; the processor is the single writer, so it is the safe place.
- **An index on `bloomQueue` for tend idempotency:** rows are deleted once processed, so it can't answer "already tended today" after a minute.
- **A disabled "Send a comet" button:** a control that does nothing.

## Consequences

- One optional schema field. Old rows read as an empty list.
- `jobs.cleanup` (Phase 12) removes tend markers with the other `worldVisits` older than 60 days; `lastTendedDay` keeps the streak.
