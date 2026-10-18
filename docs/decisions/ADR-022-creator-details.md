# ADR-022: World creator details

- **Status:** Accepted
- **Date:** 2026-10-18
- **Spec:** §2.2 (Create), §3.4, §3.6, §8.7, §11.4

## Context

Phase 6 builds `/create` from §2.2 and the 06 desktop creator mockup. A few points needed a decision:

- The mockup groups the controls into three tabs, while §2.2 lists six sections.
- The mobile panel must be a bottom sheet with snap points that leaves the world usable. The §3.4 Sheet is a modal Radix dialog.
- §8.7 requires WebP thumbnails, but Safari can't encode WebP from a canvas: it quietly returns a PNG.
- §11.4 has no limit for thumbnail uploads.
- Onboarding already gives every account its primary world (ADR-017).

## Decision

- **Panel:** the 06 tabs hold the SPEC sections. Landscape has Presets, Shape and Colors; Atmosphere has Sky; Details has Motion and Name. Each section is a headed group inside its tab (agreed with the project owner).
- **Mobile sheet:** a custom, non-modal sheet (`features/creator/creator-sheet.tsx`). It has three snaps: peek (handle and main action), 40% and 88% of the viewport. The handle drags with a flick, and it's also a button: tap or Enter cycles, arrow keys step. The collapsed content is `inert`. The persistent Pause motion control rides above the sheet through `--motion-control-lift`.
- **Thumbnails:** native WebP when the browser makes it. Otherwise `@jsquash/webp` (pinned, Apache-2.0) is lazy-loaded for that capture. The server still accepts only `image/webp` up to 300KB.
- **Upload limit:** `generateThumbnailUploadUrl` spends a `world.update` token, so uploads stay bounded without a new §11.4 key.
- **`setThumbnail` returns `{ ok: false, reason }`** for a wrong type or size instead of throwing. A throw would roll back the deletion of the rejected file.
- **No `worlds.create` yet:** signed-in owners edit their primary world. `worlds.create` (§5.5) waits until people can have more than one world.
- **Randomize** re-forms the world over the 600ms "slow" world moment: the terrain settles flat, the new world swaps in at the midpoint, then rises. History, the draft and the announcement update at once. With reduced motion it swaps instantly.

## Alternatives considered

- **Six stacked sections, no tabs:** simpler, but it doesn't match the mockup layout.
- **vaul for the sheet:** unmaintained, adds a dependency, and gives less control over a11y.
- **Accept PNG thumbnails:** larger files and a spec change.

## Consequences

- The WASM encoder only downloads on Safari, and only when a thumbnail is taken.
- Thumbnails need a live canvas. On tier 0 there is none, so those worlds have no thumbnail until a save from a WebGL device.
