# ADR-018: Brand handoff (08) is the source of token values

- **Status:** Accepted
- **Date:** 2026-10-18
- **Spec:** §3.1, §3.2, §3.3, §3.5, §3.7, §7

## Context

Phases 1 to 4 were built before the brand kit was complete. `docs/brand/08-handoff/` now delivers `worldling.tokens.json`, the source of truth for every visual value. It ships a generated Tailwind v4 `@theme static` block too. Its values differ from those printed in SPEC §3.2. The radii are 16/24px, not 14/22px. Glass is Deep Space at 88% with a 20px blur, not 62%. The focus offset is 3px, and the easings and durations differ. It adds three shadows and a nine-level type scale plus UI text styles. The 62% glass failed AA for muted text over bright backdrops (`docs/brand/README.md`, contrast check).

Email templates also need the same values as literals, because email clients can't read CSS variables. Until now a hand-typed `theme.ts` mirrored the colors, and a regex test kept them in step.

## Decision

- **Token values come from 08.** `scripts/build-tokens.mjs` (`pnpm tokens`) reads `worldling.tokens.json` and writes two files:
  - the marked brand block in `src/styles/tokens.css`
  - `convex/email/templates/emailTheme.ts`

  `pnpm tokens:check` and a vitest case fail on drift. Nobody edits either generated part by hand.

- **SPEC token names stay.** The names 08 adds are kept:
  - Shadows: `shadow-panel`, `shadow-dialog`, `shadow-selection`.
  - Colors: `glass-control-line`.
  - Type: `text-{display,h1..h4,body-lg,body,small,caption,button,label,input,data,timestamp}` and the matching `wl-*` utilities.
  - Durations: `press`, `panel-exit`, `comet`, `bloom`, `drift`, `rotation`, `orbit`, `reduced`.
  - Easings: `press`, `comet`, `linear`.
  - Other: `border-focus-*`, `size-*`, `layout-*`, `icon-*`, `measure-*`.
- **SPEC names alias the 08 ones.** `--gradient-brand` aliases `--gradient-worldling`, and `--focus-ring-*` aliases `--border-focus-*`.
- **Retired names:** the pre-brand type sizes (`text-xs` to `text-3xl`, old `text-display`) and `shadow-raised`.
- **App-only tokens stay hand-written in `tokens.css`:**
  - scrim, Google colors, breakpoints, containers, `duration-flight`
  - overlay animations
  - `--press-scale`
  - the quiet-space backdrop
- **Glass and controls:** glass is 88% Deep Space with a 20px blur. It falls back to opaque Deep Space. Inside glass, control borders switch to Dust (`glass-control-line`) through the `glass` and `border-control` utilities in `globals.css`.
- **Motion:** `src/lib/motion.ts` mirrors every duration and easing. It registers GSAP `CustomEase`s with the same control points. Reduced motion turns entrances into a 150ms fade and removes press scaling.
- **Fonts:** they stay on `next/font/google`, loaded in one file (`src/styles/fonts.ts`). Bricolage keeps its `opsz` and `wdth` axes. The 08 WOFF2 files are references only, so they don't ship.
- **Icons:** they stay on `lucide-react`, adjusted to the 05 rules:
  - 1.75 stroke, round caps and joins
  - sizes 16, 20, 24 and 32
  - `aria-hidden` when decorative

  The brand icon set doesn't ship. CLAUDE.md allows only logo, app icon and favicon files.

- **Email header and footer:** emails use the 06 layout. The logo is a 2x PNG derived from the 02-logo on-dark lockup. It's served from `/public`, and its absolute URL is built from `SITE_URL`.

## Alternatives considered

- **Import `worldling.theme.css` directly:** rejected. It keeps Tailwind's default palette and sizes alongside ours, so raw `text-sm` or `bg-gray-500` would still compile. It also can't hold our resets, aliases or font variables.
- **Self-host the 08 WOFF2 fonts with `next/font/local`:** rejected. The brand rules ship only logo, app icon and favicon files. The Google families are the same variable fonts.
- **Keep hand-typed email colors with a parity test:** rejected. One generator from one JSON removes the duplication.

## Consequences

- To change a brand value, edit the JSON and run `pnpm tokens`. CSS, email, the contrast test and the parity tests all follow.
- `tailwind-merge` must know the brand scales (`src/lib/utils.ts`). Otherwise `text-body-lg` reads as a color and drops `text-on-warm`.
- Spacing tokens must not reuse container names. `--spacing-panel` once shadowed `max-w-panel`, so the padding tokens are `panel-pad` and `panel-pad-lg`.
- A light theme is still deferred (ADR-013). The darker light-theme status values are recorded in `docs/brand/README.md`.
