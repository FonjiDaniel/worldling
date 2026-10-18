# ADR-020: Shader glow instead of a bloom pass, StatsGl instead of r3f-perf

- **Status:** Accepted
- **Date:** 2026-10-18
- **Spec:** §3.8, §4.2, §8.2, §8.8

## Context

§8.2 asks for "subtle bloom, SMAA" at tier 3, and §4.2 lists `r3f-perf` as the dev performance overlay.

- drei `<View>` renders each scene into a scissored part of the default framebuffer. `EffectComposer` (postprocessing) renders the whole scene into its own target and composites full screen. It would wipe or double-render the views, and a selective composer per view would multiply draw calls and memory.
- `r3f-perf@7.2.3`, the latest release, depends on `@react-three/drei@^9` and `zustand@~4`. Those target R3F v8; this project runs R3F v9 and drei v10.

## Decision

- No post-processing pass. Tier 3 sets `uGlow = 1`, which lifts the emissive accents (lava seams and seas, atmosphere limb) slightly inside the planet shaders. Tier 3 antialiasing is MSAA (`antialias: true`), not SMAA.
- `@react-three/postprocessing` and `postprocessing` are not installed.
- The dev perf overlay is drei `<StatsGl>`, on with `?perf=1` or the leva toggle on `/dev/planet`.

## Alternatives considered

- **EffectComposer on the root scene:** breaks scissored views.
- **One composer per view:** per-view render targets, too much GPU memory for the tier 1 budget.
- **Forcing r3f-perf to install with R3F v9:** two copies of drei and zustand in dev, with unsupported internals.

## Consequences

- Smaller 3D chunk: the measured gzip size is about 241KB.
- The glow is a shader term, so it costs nothing extra on tier 3. It is not a true blur around bright pixels.
- Revisit in Phase 11 (landing cinematic) if a hero shot needs real bloom. A full-screen landing scene without `<View>` could use a composer there alone.
- SPEC §3.8, §4.2, §8.2 and §8.8 are updated.
