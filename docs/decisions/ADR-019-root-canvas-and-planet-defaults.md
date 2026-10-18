# ADR-019: Root-layout canvas and planet render defaults

- **Status:** Accepted
- **Date:** 2026-10-18
- **Spec:** §2.4, §3.5, §8.1, §8.3

## Context

SPEC §8.1 mounted `ExperienceRoot` in the `(marketing)` and `(app)` layouts. Moving between those route groups would unmount the canvas and create a new WebGL context, which breaks ADR-002's "one persistent canvas" goal. Phase 5 also had to settle a few render details the SPEC leaves open: color management, how drei `<View>` scenes sit over the space background, when clouds appear (§2.4 lists "Drifting clouds" at level 2), and reduced motion, where the SPEC and the brand motion table disagree.

## Decision

- **Mount:** `src/three/ExperienceMount.tsx` sits once in the root layout (`src/app/layout.tsx`). It loads `ExperienceRoot` with `next/dynamic` only after a page registers a `ThreeView`, so pages without 3D never download the 3D chunk. `body` is `isolate`, so the fixed canvas at `z-index: -1` paints above the body background and below the page.
- **Color:** `<Canvas flat>` (no tone mapping) keeps curated palettes true. Uniform colors are converted to linear light in `paramsToUniforms`; shaders end with three's `colorspace_fragment`, so output stays sRGB.
- **Space background:** drei `<View>` renders scissored with `autoClear` off and takes over the R3F loop. `SpaceBackdrop` runs first each frame (priority 0): it resets the viewport, clears, and draws Void, the 8% nebula tints and static stars in sRGB, matching the CSS `--space-backdrop`. Views then draw on top. The canvas uses `alpha: false` as §8.1 says.
- **Clouds:** clouds show at level 1, set by `clouds.coverage`, and stay still. Level 2 makes them drift (`unlocksFor().cloudDrift`). This keeps the creator's cloud controls meaningful for new worlds.
- **Reduced motion:** the SPEC wins (decided by the product owner). Planets keep rotating at 35% speed (`REDUCED_MOTION_RATE`), with a persistent Pause motion control. Camera flights and other motion follow §3.5 as before.
- **Brand art colors** reach the renderer only through the `--art-*` tokens in `src/styles/tokens.css`, read once by `src/three/art.ts`.

## Alternatives considered

- **Canvas per route group, as first written:** loses the context on group changes and doubles the setup cost.
- **`alpha: true` with the CSS backdrop showing through:** costs compositing and contradicts §8.1.
- **Hiding clouds until level 2:** a new world's cloud sliders would do nothing.
- **Brand reduced motion (static planets):** rejected in favor of the SPEC behavior.

## Consequences

- One canvas for the whole session, including `/dev`. Its lifetime is the tab, so scenes must dispose what they create (§8.10).
- Any page with 3D pays one backdrop pass per frame. It costs one fullscreen triangle with a trivial shader.
- SPEC §2.4, §3.5 and §8.1 are updated to match. The brand README notes the reduced-motion deviation.
