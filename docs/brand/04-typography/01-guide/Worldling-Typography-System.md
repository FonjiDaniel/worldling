# Worldling: Step 4 typography system

## Final font choices

### Bricolage Grotesque

Expressive display text and h1 to h3. Its distinctive shapes add warmth and curiosity. Large headings give it room to feel crafted without making everyday controls playful.

### Geist

Body text, h4, buttons, inputs and supporting labels. Its restrained shapes keep reading and controls calm. It gives the expressive headings a clear, practical companion.

### Geist Mono

Bloom levels, standalone counts, timestamps and coordinates. Even character widths stabilize changing numbers. Reserving it for data keeps the wider experience warm rather than technical.

The three proposed families are retained. Bricolage supplies the personality, Geist keeps interaction clear, and Geist Mono adds structure only where stable numbers help. This deliberately avoids making the whole product feel like a technical dashboard.

## Fluid type scale

The mobile reference is a 360 CSS px viewport; desktop is 1440 CSS px. Endpoint sizes assume the default 16px root. Sizes interpolate between those widths and clamp outside them. The CSS uses rem plus vw so user font preferences still affect sizing. Do not replace the root size with a fixed pixel value.

| Style | Font | Mobile / desktop | Line height | Tracking | Weight |
| --- | --- | --- | --- | --- | --- |
| Display | Bricolage Grotesque | 40 / 72 px | 1.05 (42 / 75.6 px) | -0.035em | 650 |
| H1 | Bricolage Grotesque | 36 / 56 px | 1.1 (39.6 / 61.6 px) | -0.03em | 650 |
| H2 | Bricolage Grotesque | 28 / 40 px | 1.15 (32.2 / 46 px) | -0.025em | 650 |
| H3 | Bricolage Grotesque | 24 / 30 px | 1.2 (28.8 / 36 px) | -0.02em | 600 |
| H4 | Geist | 20 / 24 px | 1.3 (26 / 31.2 px) | -0.01em | 600 |
| Body large | Geist | 18 / 20 px | 1.6 (28.8 / 32 px) | 0em | 400 |
| Body | Geist | 16 / 18 px | 1.6 (25.6 / 28.8 px) | 0em | 400 |
| Small | Geist | 14 / 16 px | 1.5 (21 / 24 px) | 0em | 400 |
| Caption | Geist | 12 / 14 px | 1.45 (17.4 / 20.3 px) | 0.01em | 500 |

Line heights are unitless. Tracking is in em. Mobile and desktop line-height pixel values are reference calculations, not fixed CSS heights.

### Why this hierarchy

- Display and h1 use Bricolage 650 for confidence without an overly heavy block.
- H2 continues the voice; h3 softens to weight 600.
- H4 moves to Geist 600 so compact panels and controls stay quiet.
- Body copy starts at 16px, with a generous 1.6 line height.
- Small and caption styles are for supporting information. Errors, instructions and important actions stay at body or UI size.

## Supporting UI styles

| Style | Font | Size | Weight | Line height | Tracking |
| --- | --- | --- | --- | --- | --- |
| Button | Geist | 16px / 1rem | 600 | 1.25 | 0 |
| Form label | Geist | 14px / 0.875rem | 500 | 1.4 | 0 |
| Input text | Geist | 16px / 1rem | 400 | 1.5 | 0 |
| Data value | Geist Mono | 24 to 32px, fluid | 500 | 1.15 | 0 |
| Timestamp | Geist Mono | 12 to 14px, fluid | 500 | 1.4 | 0 |

Use tabular lining numerals for standalone counts and timestamps. Keep numerals within normal sentences in Geist. Buttons should use sentence case and must be allowed to grow or wrap if translated text needs more room.

## Font controls

For Bricolage, use width 100% and browser optical sizing set to auto. Never narrow the width axis to make a heading fit. Allow another line instead. The wordmark has its own fixed Step 2 geometry, weight and optical settings; use the supplied logo SVG rather than typesetting it again.

The distributed fonts are upright variable families. Interface emphasis uses weight rather than faux italics. Browser fallback stacks remain enabled for scripts or characters outside the bundled fonts.

## Pairing examples

### English landing introduction

- H2, Bricolage 650: "Grow a world of your own."
- Body large, Geist 400: "Visit everyone else's."
- Body, Geist 400: "Choose a landscape, add a little color, and let your world bloom. Every visit brings a little more life."
- Button, Geist 600: "Create my world"

### French landing introduction

- H2, Bricolage 650: "Fais grandir ton propre monde."
- Body large, Geist 400: "Explore celui des autres."
- Body, Geist 400: "Choisis un paysage, ajoute une touche de couleur et laisse ton monde s’épanouir. Chaque visite lui donne un peu plus de vie."
- Button, Geist 600: "Créer mon monde"

The French examples propose an informal tu-form suitable for this specimen. They demonstrate typography, not a final translation or Step 7 voice decision.

### World header and data

- H1, Bricolage 650: "Éclats d’aurore"
- Small, Geist 400: "par @mira"
- Body, Geist 400: "Ton monde s’épanouit."
- Labels, Geist 500: "Niveau", "Visites", "Comètes"
- Values, Geist Mono 500: "07", "1 248", "32"
- Button, Geist 600: "Envoyer une comète"

## Reading and localization rules

1. Keep headings and controls in sentence case. Do not copy the logo's all-lowercase treatment into every sentence.
2. Aim for 50 to 65 characters per line in reading copy on wide screens. Let mobile copy fill the available width with normal side padding.
3. Let titles and translated labels wrap. Do not use fixed-height text boxes or reduce a translated label's font size to force it onto one line.
4. Set the correct HTML lang attribute and keep accents, ligatures and apostrophes intact. Check uppercase accents as well as lowercase ones.
5. Retain nonbreaking spacing from locale-aware number formatting. The tested Geist and Geist Mono files do not encode U+202F narrow no-break space, so a browser fallback can supply it. The letters, French accents, œ/Œ, æ/Æ, apostrophe and guillemet samples passed the included glyph check.
6. User-created names can be much longer than the examples. Use overflow-wrap:anywhere for those fields and avoid uppercase transformations.
7. Use Starlight for essential copy, Dust for supporting copy, and Nebula 300 for links on dark surfaces, following Step 3. Do not lower text opacity to make a label look quiet.
8. Allow the browser to zoom and users to override text spacing. Important controls must remain visible after enlargement. Specimen checks are documented separately and do not establish whole-app accessibility conformance.

## Fluid CSS formulas

For a minimum m and maximum M in pixels, the slope is (M - m) / (1440 - 360). The preferred size is `(m - slope * 360) / 16` rem plus `slope * 100` vw. Clamp between m/16 and M/16 rem.

- `Display`: `clamp(2.5rem, calc(1.833333rem + 2.962963vw), 4.5rem)`
- `H1`: `clamp(2.25rem, calc(1.833333rem + 1.851852vw), 3.5rem)`
- `H2`: `clamp(1.75rem, calc(1.500000rem + 1.111111vw), 2.5rem)`
- `H3`: `clamp(1.5rem, calc(1.375000rem + 0.555556vw), 1.875rem)`
- `H4`: `clamp(1.25rem, calc(1.166667rem + 0.370370vw), 1.5rem)`
- `Body large`: `clamp(1.125rem, calc(1.083333rem + 0.185185vw), 1.25rem)`
- `Body`: `clamp(1rem, calc(0.958333rem + 0.185185vw), 1.125rem)`
- `Small`: `clamp(0.875rem, calc(0.833333rem + 0.185185vw), 1rem)`
- `Caption`: `clamp(0.75rem, calc(0.708333rem + 0.185185vw), 0.875rem)`

## Handoff

- `02-type-files/worldling-typography.css`: font-face declarations, fluid size variables and appearance classes.
- `02-type-files/worldling-typography.json`: complete type specifications and locale specimens.
- `03-fonts/woff2`: web-ready variable fonts, converted from the included original TTF files without changing glyphs or axes.
- `03-fonts/ttf`: original variable font binaries.
- `03-fonts/licenses`: original OFL notices. Keep the notices with redistributed fonts.
- `04-previews/specimen.html`: a local, responsive specimen using the included fonts and CSS.
- `05-source`: verification results and a reproducible type-scale audit.

Copy CSS and font folders together so relative font URLs resolve, or update the URLs for your app's asset structure. This file contains type only; it does not replace the complete Tailwind theme planned for Step 8.

## Sources

- [Bricolage Grotesque, official project](https://github.com/ateliertriay/bricolage)
- [Geist, official family page](https://vercel.com/font)
- [WCAG 2.2, Resize Text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html)
- [WCAG 2.2, Text Spacing](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html)
