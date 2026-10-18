# ADR-021: A minimal world page lands in Phase 6

- **Status:** Accepted
- **Date:** 2026-10-18
- **Spec:** §2.1, §2.2 (Create), §5.5, §15 (Phases 6 and 7)

## Context

§2.2 says that after sign up and onboarding the person "lands on their world page with a celebration moment". The world page, `/w/[username]`, is scheduled for Phase 7. Phase 6 had to celebrate somewhere: on a world page that doesn't exist yet, or on the `/me` placeholder.

## Decision

Pull a thin, final-shaped world page forward (agreed with the project owner on 2026-10-18):

- `worlds.getByUsername` (publicQuery), as §5.5 lists it. It returns `{ world: { _id, name, params, level, thumbnailUrl }, owner: { username, displayName }, isOwner }`, or null for unknown names, hidden worlds and owners who aren't active.
- `/w/[username]`: the world full screen, its name, its owner, an "Edit my world" link for the owner, and the not-available state.
- The claim celebration (07 `celebrations.world_created`), shown once through a one-shot `sessionStorage` flag that onboarding sets.
- The owner's page makes the first thumbnail when the world has none (a freshly claimed world).
- `/me` redirects to `/w/{username}`. `AFTER_SIGN_IN_PATH` stays `/me`, so every sign-in still lands on the person's own world.

## Alternatives considered

- **Celebrate on `/me`, build `/w/[username]` in Phase 7:** the celebration would move again in Phase 7, and §2.2's "world page" would be wrong for a phase.

## Consequences

- Phase 7 extends this page: server metadata with `preloadQuery`, bloom progress, visits, tend, comets, the OG image and sharing. Its §15 entry says so.
- The "Explore worlds" action from the 07 `world_unavailable` copy waits for `/universe` (Phase 8).
