# Worldling developer handoff

Grow a world of your own. Visit everyone else's.

This package brings the approved Worldling identity into a single implementation source. It includes the complete color scales, fluid typography, spacing, radii, shadows, motion, fonts, production logo files, optical favicons, icons and English/French copy.

## Start here

1. Read `Worldling-Brand-Summary.pdf` for the one-page brand direction.
2. Use `worldling.tokens.json` as the source of truth for design values.
3. Import `worldling.theme.css` after Tailwind CSS v4, then import the fonts. The base and component styles are optional.
4. Read `docs/Implementation.md` for color roles, motion behavior, asset selection and integration details.
5. Use the latest strings in `copy/`. Step 7 wording takes precedence over text in earlier design specimens.

```css
@import "tailwindcss";
@import "./worldling.theme.css";
@import "./worldling.fonts.css";
@import "./worldling.base.css";
@import "./worldling.components.css";
```

Put these imports in your application's Tailwind entry stylesheet. Adjust paths to match your project. Keep font URLs aligned with the location of the final CSS or let your bundler resolve them.

## Files

| File or folder | Purpose |
| --- | --- |
| `worldling.tokens.json` | Plain JSON tokens and implementation guidance |
| `worldling.theme.css` | Generated Tailwind v4 `@theme static` block and utilities |
| `worldling.fonts.css` | Self-hosted variable WOFF2 declarations |
| `worldling.base.css` | Optional dark page and typography defaults |
| `worldling.components.css` | Optional glass, action, input, focus and motion recipes |
| `scripts/build-theme.mjs` | Regenerates the theme and variable map from JSON |
| `examples/` | Import order and a world-card markup example |
| `assets/` | Approved logos, marks, icons, favicons, app icons, fonts and licenses |
| `copy/` | Matching English and French keys, plus copy context |
| `docs/` | Implementation notes, variable inventory, source provenance and validation |
| `Worldling-Brand-Summary.pdf` | One-page shareable brand guide |
| `Worldling-Brand-Summary.md` | Editable text version of the guide |

## Change values once

Edit the JSON, then run this command from the package folder:

```sh
node scripts/build-theme.mjs
```

The generator has no package dependencies. It emits 177 unique CSS custom properties, including all 25 required names, plus 14 complete typography utilities, named transition-duration utilities and a gradient utility. Descriptive metadata and motion behavior remain in JSON because they describe application behavior rather than CSS values.

The generated theme was compiled successfully with Tailwind CSS 4.3.3. A project needs its own Tailwind v4 build integration. This handoff does not include an application build or a working message composer.

## Quick example

```html
<section class="wl-glass">
  <h1 class="wl-h1 wl-world-title">A world of your own</h1>
  <p class="wl-body mt-4 text-text-muted">Make a little room for wonder.</p>
  <button type="button" class="wl-warm-action mt-6">
    Create my world
  </button>
</section>
```

The `wl-*` typography utilities set the font family as well as size, weight, line height and tracking. If you use the Tailwind size utilities directly, pair them with a family, for example `font-display text-h1` or `font-sans text-body`.

Worldling v1.0.0. Approved identity from Steps 2 through 7; developer handoff in Step 8.
