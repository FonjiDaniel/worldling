# Worldling implementation notes

## Token structure

`worldling.tokens.json` uses a small, plain JSON schema. It is not a DTCG interchange file. Colors, dimensions, shadows and easings are CSS-ready strings; weights and line heights are numbers. Descriptive properties explain behavior and usage. A reference root size of 16px was used when converting the approved pixel measurements to rem.

| JSON group | CSS mapping |
| --- | --- |
| `color` | `--color-*`, including nested `--color-nebula-50` through `--color-sunrise-950` |
| `typography.family` | `--font-display`, `--font-sans`, `--font-mono` |
| `typography.weight` | `--font-weight-*` |
| `typography.scale` and `typography.ui` | `--text-*` and line-height, letter-spacing and font-weight companions |
| `radius`, `spacing`, `shadow` | `--radius-*`, `--spacing`, `--spacing-*`, `--shadow-*` |
| `motion.duration` and `motion.ease` | `--duration-*`, `--ease-*` |
| `blur`, `border`, `size`, `layout`, `gradient`, `icon` | Matching prefixed custom properties |
| Type measures and display width | `--measure-body`, `--measure-display`, `--display-width` |

`docs/css-variable-map.json` is the complete flat map. `docs/required-variables.json` holds the exact 25 names requested in the brief. The build script rejects missing required names or duplicate variables. `@theme static` preserves every token in the compiled CSS for CSS, JavaScript and WebGL consumers.

## Tailwind v4 integration

Use the import order in `examples/app.css` in an existing Tailwind v4 project. The JSON generator is independent of Tailwind. Run it whenever you change the JSON, then run your application's normal Tailwind build. Do not edit the generated theme by hand.

The theme adds brand tokens to Tailwind's defaults. Defaults that are not overridden remain available. The optional base stylesheet sets the dark background, text, body font and line height; it does not assign visual heading levels automatically. Apply a type utility to each heading.

| Goal | Example |
| --- | --- |
| Page background | `bg-void text-text` |
| Panel | `bg-surface rounded-lg shadow-panel` |
| Raised surface | `bg-surface-raised` |
| Muted text | `text-text-muted` |
| Display heading, complete style | `wl-h1` |
| Display heading, native utilities | `font-display text-h1` |
| Body copy, complete style | `wl-body` |
| Numeric value | `wl-data` |
| Transition timing | `transition-colors duration-fast ease-out` |
| Read an exact duration variable | `duration-(--duration-fast)` |
| Signature gradient | `bg-worldling-gradient` |

The requested `--duration-*` custom properties are kept exactly. The file supplies explicit `@utility duration-*` definitions for friendly class names. These set transition duration. Animation recipes use the same variables directly in `animation` declarations.

Typography uses Tailwind's `--text-name--line-height`, `--text-name--letter-spacing` and `--text-name--font-weight` companions. A native `text-h1` utility does not set a font family, so use `font-display` with it. The complete `wl-h1` helper sets all properties. `wl-data` and `wl-timestamp` also set tabular numerals.

The component file has one literal `48rem` media-query breakpoint, matching `layout.panel-breakpoint`. CSS variables cannot be used in that media-query condition. Update both if you change the panel breakpoint.

## Color roles

| Role | Use |
| --- | --- |
| Void | Main page background and ink on filled brand buttons |
| Deep Space / surface | Panels and opaque glass fallback |
| Orbit / surface-raised | Raised items and inset controls |
| Starlight | Primary text |
| Dust | Secondary text |
| Nebula / primary | Brand identity, selected fills and limited emphasis |
| Aurora / accent | Highlights, focus rings and bloom details |
| Sunrise / warm | Main action, with Void text |
| Nebula 300 / link | Text links on dark surfaces |
| Success, warning, danger, info | Status text or icons with the matching status surface |

Use `--color-line` for decorative dividers. Use `--color-control-line` where a solid control boundary is needed. Within glass, use the stronger `--color-glass-control-line`. A decorative divider is not a substitute for a clearly visible input boundary.

The glass recipe uses Deep Space at 88% with 20px blur. It falls back to opaque Deep Space when backdrop blur is unavailable. Verify the final composite where a bright planet sits behind a panel; a translucent token has no fixed contrast ratio on its own.

Use Void text on Nebula 500, Aurora 500 and Sunrise 500 fills. Starlight on Nebula 500 does not meet AA for ordinary text. The provided main-action recipe uses Sunrise 400 on hover and Sunrise 600 while pressed, retaining Void ink. Do not assume every tint/shade pair is interchangeable. The Step 3 contrast matrix remains the detailed reference.

Treat 70% dark surfaces, 20% text and structure, and 10% accent as a guide to visual emphasis rather than a literal pixel count. Use the Nebula-to-Aurora gradient sparingly for hero moments. Status is communicated with words or icons as well as color.

## Typography and language

The included WOFF2 files are the approved variable fonts. `worldling.fonts.css` uses `font-display: swap`; ship the corresponding OFL license files with the fonts. Keep the declared font names intact.

Bricolage Grotesque is the display voice, mainly weight 650, normal width at 100%, with automatic optical sizing. Geist carries body and UI text. Geist Mono is for standalone numeric data and timestamps, not every numeral within a sentence.

The fluid scale interpolates from a 360px viewport to 1440px using rem and vw. The reference root size is 16px. Leave the user's root font preference intact. Body copy ranges from 16px to 18px; display ranges from 40px to 72px at that reference root. Use `--measure-body` at 65ch and `--measure-display` at 16ch as starting line-length limits.

Use the matching keys in `copy/worldling-copy.en.json` and `copy/worldling-copy.fr.json`. Step 7 copy supersedes specimen wording in earlier steps. French uses friendly `tu`: `Niveau de floraison` is the growth label. English taglines remain “Grow a world of your own.” and “Visit everyone else's.” French uses “Fais grandir un monde à ton image.” and “Découvre les mondes des autres.”

Set the document or content language to `en` or `fr`. Allow French buttons and labels to wrap naturally. Do not bake words into planet images, concatenate translated fragments or force UI labels to uppercase. Native locale formatting should handle dates and numbers. `copy/worldling-copy-context.json` explains the string intent and placeholders.

## Layout, icons and assets

Use a 4px spacing unit. Standard radii are 8px, 16px and 24px, with full rounding for pills. The main-action recipe has a 48px minimum height. Icon-only controls have a 44px minimum target even when the icon itself is 24px or 16px. Inputs need persistent visible labels in the application; a placeholder is not a label.

The 24px icons use 1.75px strokes with round caps and joins. Use the separately drawn 16px optical icons at 16px. Meaningful icons need an accessible name; decorative icons beside an existing label should be hidden from assistive technology. The examples are markup references, and the application must wire its own interactions and states.

Use the supplied logo SVGs. The wordmark is outlined and should not be retyped. The master mark has a solid planet, a 19-degree ring rising toward the right, a slightly larger raised right leaf and an even transparent front-ring gap. Do not redraw it in CSS or apply a filter to change its color.

| Logo use | Minimum width |
| --- | --- |
| Master mark | 48 CSS px |
| Horizontal lockup | 160 CSS px |
| Stacked lockup | 128 CSS px |
| Hero gradient mark | 128 CSS px |
| Optical favicon | Supplied 32px or 16px version |

Clear space is one quarter of the planet's diameter on every side. Keep this outside the visible logo bounds. The approved core geometry is based on a 1024-unit canvas: planet center (512, 590), radius 216; orbit radii 394 and 100, rotated -19 degrees in SVG coordinates, 22-unit ring stroke, 12-unit front gap on either side. The transparent knockout is 46 units wide. Optical favicon geometry is deliberately different; do not shrink the master into a 16px icon.

Use `assets/logos/*white-transparent.svg` over dark surfaces and the dark transparent version over light surfaces. `assets/marks/worldling-mark-primary-nebula.svg` is the flat brand-color mark; the hero gradient is reserved for large use. The complete brand archive includes the Step 2 geometry and rebuild guide.

## Motion and accessibility

| Token | Duration | Purpose |
| --- | --- | --- |
| fast | 150ms | Color feedback |
| base | 240ms | Panel entrance |
| slow | 600ms | World/camera focus |
| comet | 900ms | A single short comet arrival |
| bloom | 1200ms | Reveal new world detail |
| drift | 16000ms | One full 0px to -4px to 0px cycle |

Feedback uses `cubic-bezier(0.2, 0.8, 0.2, 1)`. World motion uses `cubic-bezier(0.45, 0, 0.55, 1)`. The complete behavior table is in `motion.behavior`, including 180ms panel exit, 100ms press feedback, optional 120-second planet rotation and 90-second moon orbit.

The CSS recipes implement panel entrance, bloom reveal and ambient drift. They honor the system `prefers-reduced-motion` setting and an app-level `data-reduced-motion="true"` attribute on an ancestor. For example, set the preference attributes on `<html>`. Reduced motion uses a 150ms fade for entrances, removes ambient drift and avoids scaling or travel. Color feedback can be immediate or 100ms.

Ambient drift is opt-in through `data-ambient="on"` on an ancestor. Provide a persistent “Pause motion” control that sets `data-motion-paused="true"`. Keep that choice separate from the more comprehensive reduced-motion preference. Pause ambient motion when the page is hidden or the world is offscreen.

The application must apply those preferences to WebGL, camera motion, comet paths, rotation and moon orbits too. CSS rules do not stop a JavaScript render loop. Reduced motion should use stationary views, completed details and manual view controls. Avoid camera roll, rapid zoom, endless parallax, flashing stars and urgency-driven animations.

## Art and voice

Worlds are painterly miniature dioramas: soft upper-left light, matte terrain, satin oceans, gentle atmospheric edges and a quiet dark field. Use a few small stars, faint nebula dust and fine grain. Keep texture away from small copy and control boundaries. Do not substitute glossy game trophies, neon clutter or photorealistic space photography.

Make wonder feel close. Be clear when it matters. Invite people at their own pace. Celebrate care and connection. Use warm everyday language. Errors explain what happened and the next useful action. Avoid guilt, false urgency, streak pressure and claims that something was saved or sent before the application has confirmed success.

## Verification and references

The handoff was compiled with Tailwind CSS 4.3.3. `docs/validation.json` records the token parity, required-variable check, generated utilities, source asset checks and PDF checks. Source hashes are in `docs/source-versions.json`.

Official implementation references:

- [Tailwind theme variables](https://tailwindcss.com/docs/theme)
- [Tailwind functions and directives](https://tailwindcss.com/docs/functions-and-directives)
- [Tailwind font-size theme companions](https://tailwindcss.com/docs/font-size)
- [Tailwind transition duration](https://tailwindcss.com/docs/transition-duration)

These checks validate the handoff files and example CSS. They do not constitute an accessibility audit of a finished Worldling application.
