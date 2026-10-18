# Worldling brand kit: index

Start here. This file maps every file in `docs/brand/`, pulls the brand values into text, and records the logo and contrast checks. Indexed 2026-10-18; 08 handoff applied to code the same day (ADR-018).

## How to use this kit

1. `docs/SPEC.md` decides structure, behavior, token **names** and accessibility.
2. This kit decides visual **values**: colors, fonts, radii, shadows, motion feel, art direction, copy tone.
3. WCAG 2.2 AA beats brand colors. Failing pairs and their adjusted values are under [Contrast check](#contrast-check).
4. Images are references, not assets. Copy text from `07-voice/` or the SPEC, never from an image.
5. Only logo, app icon and favicon files from `02-logo/` ship in the product.
6. Values reach code only through `src/styles/tokens.css` and `src/lib/motion.ts`. The brand block of `tokens.css` and `convex/email/templates/emailTheme.ts` are generated from `08-handoff/worldling.tokens.json` by `pnpm tokens`; never edit them by hand.

Suggested reading order:

1. This file.
2. `03-color/01-guide/Worldling-Color-System.md`.
3. `04-typography/01-guide/Worldling-Typography-System.md`.
4. `05-visual-language/01-guide/Worldling-Visual-Language.md`.
5. `07-voice/Worldling-Voice-and-Tone.md`.
6. `02-logo/05-guidelines/REBUILD.md` when touching the logo.

The kit's PDFs repeat the Markdown guides with layout. The Markdown is the editable source.

**Ships** means the file (or a byte-identical copy) is in the product. **Ref** means it is a reference only. **Tool** means a build or audit script.

## Folders

| Folder | Brand step | What it holds |
| --- | --- | --- |
| `02-logo/` | Step 2 | Logo lockups, marks, app icon, favicons, construction geometry |
| `03-color/` | Step 3 | Palette, scales, semantic colors, contrast audit |
| `04-typography/` | Step 4 | Fonts, fluid type scale, UI text styles |
| `05-visual-language/` | Step 5 | Six-world art direction, glass and controls, icons, motion, backgrounds |
| `06-applications/` | Step 6 | OG, social, product mockups, email layouts |
| `07-voice/` | Step 7 | Voice and tone, EN and FR copy strings |
| `08-handoff/` | Step 8 | Design tokens (JSON + generated Tailwind theme), recipes, one-page summary, copies of the approved assets and copy |

Folders 02 to 08 are all present. There is no `01-*` folder; the kit starts at Step 2.

## File inventory

210 files. Sets of files that differ only by color, size or name are one row with every name listed. PNG and ICO sizes are pixels.

SPEC sections and build phases refer to `docs/SPEC.md` and its §15 phases. Phases: 1 Design system and shell, 3 Email, 5 Planet renderer, 6 World creator, 7 World page and sharing, 8 Universe, 9 Comets and notifications, 10 Admin, 11 Landing cinematic, 12 Hardening, 13 Launch.

### 02-logo

| Folder | Files | Contains | SPEC | Phases | Use |
| --- | --- | --- | --- | --- | --- |
| `02-logo/` | `README.md` | Kit overview, small-size rules | §3.1 | 1 | Ref |
| `02-logo/01-logos/svg/` | `worldling-{horizontal,stacked}-{on-dark,on-light,white-transparent,dark-transparent}.svg` (8) | Lockups. Horizontal viewBox 1331x360, stacked 800x720. Outlined wordmark, no font dependency | §3.1, §12 | 1, 7, 11 | Ships: `worldling-horizontal-white-transparent.svg` is `public/brand/` (identical) |
| `02-logo/01-logos/png/` | Same 8 names with `@2x.png` | Lockup PNGs, horizontal 2662x720, stacked 1600x1440 | §7, §12 | 3, 7 | Ref (email may use a PNG lockup) |
| `02-logo/02-marks/svg/` | `worldling-mark-{starlight-on-void,dark-on-starlight,white-transparent,dark-transparent,primary-nebula,hero-gradient}.svg` (6) | Master mark, 1024 viewBox | §3.1 | 1, 11 | Ships: `worldling-mark-hero-gradient.svg` is `public/brand/` (identical) |
| `02-logo/02-marks/png/` | Same 6 names with `-1024.png` | Mark PNGs 1024x1024 | §12 | 7 | Ref |
| `02-logo/03-app-icon/` | `worldling-app-icon-rounded.svg`, `-rounded-1024.png`, `-rounded-512.png`, `worldling-app-icon-square-source.svg`, `-square-source-1024.png` | App icon: rounded (radius 224) and unrounded source | §12 | 1, 13 | Ships: `-rounded-512.png` is `src/app/apple-icon.png` (identical) |
| `02-logo/04-favicons/` | `favicon.ico` (16/32/64 frames), `favicon.svg` (32px optical) | Browser favicons | §12 | 1 | Ships: `src/app/favicon.ico` and `src/app/icon.svg` (identical) |
| `02-logo/04-favicons/` | `worldling-{16,32,64,1024}.{svg,png}` | Optical marks on Void, at true size | §12 | 1 | Ref |
| `02-logo/04-favicons/` | `worldling-transparent-{16,32,64}.{svg,png}` | Optical marks, Starlight on transparent | §12 | 1 | Ref |
| `02-logo/04-favicons/` | `worldling-direct-reduction-{16,32}.{svg,png}` | Master shrunk without optical fixes. For comparison only, never ship | | | Ref |
| `02-logo/04-favicons/` | `usage.html` | HTML head snippet for favicons | §12 | 1 | Ref |
| `02-logo/05-guidelines/` | `REBUILD.md` | Exact construction, fills, clear space, minimum sizes, don'ts | §3.1 | 1 | Ref |
| `02-logo/05-guidelines/` | `Worldling-Logo-Guide.pdf` | Designed logo guide | §3.1 | 1 | Ref |
| `02-logo/06-previews/` | `worldling-logo-overview.png` (1600x1500), `worldling-clear-space.png` (1200x870), `worldling-logo-donts.png` (1440x510), `worldling-size-check.png` (1440x800), `worldling-size-check-native.png` (1472x1260), `size-proof.html` | Visual proofs of usage and small sizes | §3.1 | 1 | Ref |
| `02-logo/07-source/` | `worldling-geometry.json`, `rebuild_svg.py` | Machine-readable geometry including the wordmark path; SVG generator | §3.1 | | Tool |
| `02-logo/07-source/fonts/` | `BricolageGrotesque-variable.ttf`, `Geist-variable.ttf`, `GeistMono-variable.ttf`, `Bricolage-OFL.txt`, `Geist-OFL.txt`, `GeistMono-OFL.txt` | Fonts used to outline the wordmark (copies of `04-typography/03-fonts/ttf`) | §3.2 | | Ref |

### 03-color

| Folder | Files | Contains | SPEC | Phases | Use |
| --- | --- | --- | --- | --- | --- |
| `03-color/` | `README.md` | Kit overview | §3.2 | 1 | Ref |
| `03-color/01-guide/` | `Worldling-Color-System.md` | Palette, scales, semantic colors, contrast tables, usage rules. **Color source of truth** | §3.1, §3.2, §3.7 | 1, 10 | Ref |
| `03-color/01-guide/` | `Scale-Contrast-Matrix.md` | 132 scale-step contrast pairs | §3.7 | 1, 10 | Ref |
| `03-color/01-guide/` | `Worldling-Color-Guide.pdf` | Designed color guide | §3.2 | 1 | Ref |
| `03-color/02-color-files/` | `worldling-colors.css`, `worldling-colors.json` | Color custom properties and JSON (names match SPEC §3.2) | §3.2 | 1 | Ref (values are in `tokens.css`) |
| `03-color/03-previews/` | `Worldling-Color-Overview.png` (1600x1860), `Worldling-Contrast-Guide.png` (1600x1130) | Visual palette and contrast sheets | §3.2 | 1 | Ref |
| `03-color/04-source/` | `audit_colors.py`, `contrast-audit-report.json` | Reproducible contrast audit and its result | §3.7 | 12 | Tool |

### 04-typography

| Folder | Files | Contains | SPEC | Phases | Use |
| --- | --- | --- | --- | --- | --- |
| `04-typography/` | `README.md` | Kit overview | §3.3 | 1 | Ref |
| `04-typography/01-guide/` | `Worldling-Typography-System.md` | Font roles, 9-level fluid scale, UI styles, localization rules. **Type source of truth** | §3.2, §3.3 | 1 | Ref |
| `04-typography/01-guide/` | `Worldling-Typography-Guide.pdf` | Designed type guide | §3.3 | 1 | Ref |
| `04-typography/02-type-files/` | `worldling-typography.css`, `worldling-typography.json` | `@font-face`, fluid size variables, classes; full JSON spec with axis ranges and fallback stacks | §3.3 | 1 | Ref |
| `04-typography/03-fonts/` | `README.md` | Font provenance and licence notes | §3.2 | 1 | Ref |
| `04-typography/03-fonts/ttf/` | `BricolageGrotesque-variable.ttf`, `Geist-variable.ttf`, `GeistMono-variable.ttf` | Original variable fonts | §3.2 | 1 | Ref (app loads the same families through `next/font`, `src/styles/fonts.ts`) |
| `04-typography/03-fonts/woff2/` | `BricolageGrotesque-variable.woff2`, `Geist-variable.woff2`, `GeistMono-variable.woff2` | Web conversions of the TTFs | §3.2 | 1 | Ref |
| `04-typography/03-fonts/licenses/` | `Bricolage-OFL.txt`, `Geist-OFL.txt`, `GeistMono-OFL.txt` | OFL notices | §3.2 | 13 | Ref |
| `04-typography/04-previews/` | `specimen.html`, `Worldling-Typography-Overview.png`, `Worldling-Type-Scale.png`, `Worldling-Type-Specifications.png`, `Worldling-Type-Pairings.png`, `Worldling-French-Type-Detail.png` (all 1284x1650) | Live specimen and preview sheets | §3.3 | 1 | Ref |
| `04-typography/05-source/` | `audit_typography.py`, `typography-audit.json` | Font coverage and scale audit | §3.3 | 12 | Tool |

### 05-visual-language

| Folder | Files | Contains | SPEC | Phases | Use |
| --- | --- | --- | --- | --- | --- |
| `05-visual-language/` | `README.md` | Kit overview | §3 | 1 | Ref |
| `05-visual-language/01-guide/` | `Worldling-Visual-Language.md` | Art direction, glass and controls, icons, backgrounds, motion. **Source for radii, shadows, motion** | §3.1, §3.5, §3.8, §8 | 1, 5, 8 | Ref |
| `05-visual-language/01-guide/` | `Worldling-Visual-Language-Guide.pdf` | Designed guide | §3 | 1 | Ref |
| `05-visual-language/02-art-direction/` | `Worldling-Six-Worlds-Moodboard.png` (1536x1024), `moodboard-prompt.txt` | Six biome concept art and its prompt | §3.8 | 5, 6 | Ref |
| `05-visual-language/03-icons/` | `README.md`, `worldling-icons.svg` (sprite) | Icon usage; `<symbol>` sprite | §3.4 | 1 | Ref |
| `05-visual-language/03-icons/24/` | `{bloom,comet,notification,settings,share,universe,visit,world}.svg` (8) | 24px master icons, `currentColor` | §3.4 | 1, 6, 7, 9 | Ref (shipping icons is a SPEC or ADR call, see rule 5) |
| `05-visual-language/03-icons/16/` | Same 8 names | 16px optical icons, stroke 1.5 | §3.4 | 1 | Ref |
| `05-visual-language/03-icons/png/` | `{bloom,comet,notification,settings,share,universe,visit,world}-{16,24}-starlight.png` (16) | Starlight on transparent PNGs | §3.4 | | Ref |
| `05-visual-language/04-style-files/` | `worldling-visual-language.json`, `worldling-visual-recipes.css` | Machine-readable glass, radii, shadows, motion, biome triads; CSS recipes | §3.2, §3.5, §3.8 | 1, 5 | Ref |
| `05-visual-language/05-previews/` | `Worldling-UI-Style.{png,svg}` (1440x980), `Worldling-Icon-System.{png,svg}` (1440x1020), `Worldling-Illustration-Do-Dont.{png,svg}` (1440x1210), `Worldling-Quiet-Space.{png,svg}` (1920x1080) | Visual boards | §3.1, §3.8 | 1, 8, 11 | Ref |
| `05-visual-language/06-source/` | `asset-audit.json` | Asset verification scope | | | Tool |

### 06-applications

| Folder | Files | Contains | SPEC | Phases | Use |
| --- | --- | --- | --- | --- | --- |
| `06-applications/` | `README.md` | Deliverables and decisions | §7, §12 | 3, 7 | Ref |
| `06-applications/01-images/social/` | `Worldling-OG-1200x630.png`, `Worldling-X-Header-1500x500.png`, `Worldling-Instagram-Post-1080x1350.png`, `Worldling-Instagram-Story-1080x1920.png` | Share image template and launch graphics | §12 | 7, 13 | Ref (OG is a layout reference for the generated OG image) |
| `06-applications/01-images/product/` | `Worldling-Desktop-Creator-1600x1000.png`, `Worldling-Mobile-World-1170x2532.png` | Static product mockups | §2, §3 | 6, 7 | Ref |
| `06-applications/01-images/email/` | `Worldling-Email-{Preview,Header,Footer}-{1200px,720px}.png` (6) | Email layouts at 600 and 360 logical px, 2x | §7 | 3 | Ref |
| `06-applications/02-svg/` | `Worldling-OG-1200x630.svg`, `Worldling-X-Header-1500x500.svg`, `Worldling-Instagram-Post-1080x1350.svg`, `Worldling-Instagram-Story-1080x1920.svg`, `Worldling-Desktop-Creator-1600x1000.svg`, `Worldling-Mobile-World-1170x2532.svg`, `Worldling-Email-{Preview,Header,Footer}-{1200px,720px}.svg` (12) | Matching SVG layouts, outlined text | §7, §12 | 3, 7 | Ref |
| `06-applications/03-guide/` | `Worldling-Applications-Guide.pdf`, `Worldling-Applications-Overview.png` (1600x1940), `application-index.json` | Guide, overview, dimension index | §12 | 7 | Ref |
| `06-applications/04-assets/` | `worldling-hero-world.png` (1254x1254), `world-presets.png` (1536x1024, same image as the moodboard), `hero-world-prompt.txt`, `worldling-logo.svg` | Concept art and the approved lockup | §3.8 | 11 | Ref |
| `06-applications/04-assets/icons/` | Same 8 icon names `.svg` | Copies of the 24px icons | §3.4 | | Ref |
| `06-applications/04-assets/fonts/`, `licenses/` | 3 TTFs and 3 OFL notices | Copies of the Step 4 fonts | §3.2 | | Ref |
| `06-applications/05-template/` | `og-template.json` | Editable OG fields (world name, @username, planet, tagline) | §12 | 7 | Ref |
| `06-applications/06-source/` | `build_applications.py`, `build_guide.py`, `copy-and-layout.json` | Rebuild scripts; every text run with position and size | §7, §12 | 3, 7 | Tool |

### 08-handoff

| Folder | Files | Contains | SPEC | Phases | Use |
| --- | --- | --- | --- | --- | --- |
| `08-handoff/` | `README.md`, `Worldling-Brand-Summary.{md,pdf,png}` | Handoff guide and one-page brand summary | §3 | all | Ref |
| `08-handoff/` | `worldling.tokens.json` | Every design value. **Token source of truth** | §3.2 | 1 | Tool input: `scripts/build-tokens.mjs` generates the brand block of `src/styles/tokens.css` and `convex/email/templates/emailTheme.ts` |
| `08-handoff/` | `worldling.theme.css`, `worldling.fonts.css`, `worldling.base.css`, `worldling.components.css` | Generated `@theme static`, `@font-face`, base and recipe CSS | §3.2 | 1 | Ref (recipes ported as `glass`, `glass-panel`, `border-control`, `pressable` in `src/styles/globals.css`) |
| `08-handoff/scripts/` | `build-theme.mjs` | The kit's own theme generator | §3.2 | | Tool (logic reused by `scripts/build-tokens.mjs`) |
| `08-handoff/docs/` | `Implementation.md`, `css-variable-map.json`, `required-variables.json`, `source-versions.json`, `validation.json` | Integration notes, variable inventory, provenance, checks | §3 | 1 | Ref |
| `08-handoff/examples/` | `app.css`, `world-card.html` | Import order and markup example | §3 | 7 | Ref |
| `08-handoff/assets/` | Copies of the 02 logos, marks, app icons, favicons, 05 icons, 04 WOFF2 fonts and licences | Same files as the earlier steps | §3.1 | | Ref (product ships from `02-logo/`) |
| `08-handoff/copy/` | `worldling-copy.{en,fr}.json`, `worldling-copy-context.json` | Latest copy strings (Step 7 wins) | §2 | all | Ref |

### 07-voice

| Folder | Files | Contains | SPEC | Phases | Use |
| --- | --- | --- | --- | --- | --- |
| `07-voice/` | `README.md` | Kit overview | §2 | all | Ref |
| `07-voice/` | `Worldling-Voice-and-Tone.md`, `Worldling-Voice-and-Tone-Guide.pdf` | Five principles, tone by moment, vocabulary, writing rules, rewrites, taglines. **Copy source of truth** | §2, §3.7, §7 | all | Ref |
| `07-voice/` | `worldling-copy.en.json`, `worldling-copy.fr.json`, `worldling-copy-context.json` | EN and FR strings with matching keys; when each string applies | §2, §7 | 3, 6, 7, 9 | Ref (copy text comes from here) |

## Extracted values

Sources are named per section. Every value here is in a text file of the kit. No value was only available in an image. The images checked for extra values were `Worldling-UI-Style.png`, `Worldling-Applications-Overview.png` and the logo size proofs; their visible values match the text. Email layout numbers come from the email SVGs and `copy-and-layout.json`, which are text.

### Colors

Source: `03-color/01-guide/Worldling-Color-System.md`. HEX is canonical.

| Brand name | SPEC token | HEX | Role |
| --- | --- | --- | --- |
| Void | `void` | `#07071A` | Canvas; ink on bright fills |
| Deep Space | `surface` | `#11122B` | Panels, cards, navigation |
| Orbit | `surface-raised` | `#1A1B3A` | Raised panels, menus |
| Starlight | `text` | `#F4F1EA` | Headings, body, primary icons |
| Dust | `text-muted` | `#9A9BB8` | Secondary copy, metadata |
| Nebula (500) | `primary` | `#7C6CFF` | Brand, selected controls, secondary actions |
| Aurora (500) | `accent` | `#3FE0C5` | Growth, bloom accents, focus ring |
| Sunrise (500) | `warm` | `#FF8A5B` | Main call to action |
| Nebula 300 | `link` | `#A99FFF` | Links and selected text on dark |
| Line | `line` | `#34365A` | Decorative separators only |
| Control Line | `control-line` | `#696C91` | Required control edges on opaque dark |

Semantic colors and their opaque surfaces (12% of the color over Deep Space, already composited):

| Name | Color | Surface |
| --- | --- | --- |
| Success | `#68DFA9` | `#1B2B3A` |
| Warning | `#F4C969` | `#2C2832` |
| Danger | `#FF7B91` | `#2E1F37` |
| Info | `#8AB4FF` | `#202544` |

Scales (500 is the brand anchor):

| Step | Nebula | Aurora | Sunrise |
| --- | --- | --- | --- |
| 50 | `#F3F1FF` | `#E9FCF6` | `#FFF4ED` |
| 100 | `#E8E3FF` | `#CCF8ED` | `#FFE5D7` |
| 200 | `#CBC2FF` | `#A2F1DF` | `#FFCDB6` |
| 300 | `#A99FFF` | `#76EBD3` | `#FFB394` |
| 400 | `#9182FF` | `#57E5CB` | `#FF9D75` |
| 500 | `#7C6CFF` | `#3FE0C5` | `#FF8A5B` |
| 600 | `#6550DB` | `#28B49E` | `#D96A40` |
| 700 | `#503EAF` | `#1E8C7C` | `#AC4E2E` |
| 800 | `#3D3083` | `#196B61` | `#823C26` |
| 900 | `#2A2257` | `#164E48` | `#5B2D21` |
| 950 | `#17132E` | `#0C2D2A` | `#331B16` |

States and other color rules:

- **Sunrise button:** 500 at rest, 400 on hover, 600 pressed, Void label in all three.
- **Nebula button:** stays at 500 when pressed, with a non-color cue. Void on Nebula 600 fails AA.
- **Light material** (Starlight background): Void text, Nebula 700 `#503EAF` links. This is not a full light theme (see [fixes](#adjusted-values)).
- **Signature gradient:** `linear-gradient(135deg, #7C6CFF 0%, #3FE0C5 100%)`. Use it for a hero mark, a short line or an art accent. Never put body copy or a CTA label on it.
- **Hero logo gradient:** user space from (160,790) to (864,250), `#7C6CFF` to `#3FE0C5`. Not below 128px, never in a favicon or the wordmark (`REBUILD.md`).
- **App icon background:** linear, bottom-left to top-right: `#30275A` 0%, `#202544` 56%, `#1B484B` 100%. Mark in Starlight (`REBUILD.md`).
- **Usage ratio:** dark surfaces 70% (Void 50, Deep Space 15, Orbit 5), neutral text 20% (Starlight 15, Dust 5), accents 10% (Nebula 5, Aurora 3, Sunrise 2). One dominant Sunrise action per view.

### World art palettes

Source: `05-visual-language/04-style-files/worldling-visual-language.json`. These are illustration suggestions for the curated palettes (SPEC §3.8, ADR-009), **not UI tokens**.

| Biome | Triad |
| --- | --- |
| Oceanic | `#245D82` `#69C9C2` `#E4D8B3` |
| Verdant | `#63804E` `#9FAF65` `#4DA5AC` |
| Desert | `#BD7954` `#E9B682` `#78BDB2` |
| Frozen | `#729CAF` `#BEDFE4` `#E8EDEF` |
| Volcanic | `#4B4957` `#A16658` `#F28D60` |
| Crystal | `#8C7AAF` `#C4B8D8` `#8BCBBB` |

3D starting values, from the same source:

- **Camera:** near orthographic, 25° above the equator, warm key light from the upper left.
- **Materials:** land roughness 0.8, water roughness 0.28, metalness 0.
- **Fill light:** about ⅓ of the key.
- **Level of detail:**

  | Size | Detail |
  | --- | --- |
  | 480px and up (hero) | Up to 3 landmarks |
  | 160 to 479px (card) | 1 to 2 landmarks |
  | 48 to 159px (map) | Silhouette and 2 to 3 color masses |
  | Under 48px | A simple marker |

### Typography

Source: `04-typography/01-guide/Worldling-Typography-System.md` and `02-type-files/worldling-typography.json`.

| Family | Role | Axes |
| --- | --- | --- |
| Bricolage Grotesque | Display, h1 to h3, world names | wght 200 to 800, wdth 75 to 100 (always 100), opsz 12 to 96 (auto) |
| Geist | Body, h4, buttons, inputs, labels | wght 100 to 900 |
| Geist Mono | Bloom levels, standalone counts, timestamps, coordinates (tabular numerals) | wght 100 to 900 |

Fallback stacks from the brand JSON:

| Family | Stack |
| --- | --- |
| Bricolage | `"Bricolage Grotesque", "Trebuchet MS", Arial, sans-serif` |
| Geist | `"Geist", system-ui, -apple-system, "Segoe UI", Arial, sans-serif` |

Fluid scale. Sizes interpolate between 360px and 1440px viewports, rem plus vw:

| Style | Font | Mobile / desktop | CSS | Line height | Tracking | Weight |
| --- | --- | --- | --- | --- | --- | --- |
| Display | Bricolage | 40 / 72px | `clamp(2.5rem, calc(1.833333rem + 2.962963vw), 4.5rem)` | 1.05 | -0.035em | 650 |
| H1 | Bricolage | 36 / 56px | `clamp(2.25rem, calc(1.833333rem + 1.851852vw), 3.5rem)` | 1.1 | -0.03em | 650 |
| H2 | Bricolage | 28 / 40px | `clamp(1.75rem, calc(1.5rem + 1.111111vw), 2.5rem)` | 1.15 | -0.025em | 650 |
| H3 | Bricolage | 24 / 30px | `clamp(1.5rem, calc(1.375rem + 0.555556vw), 1.875rem)` | 1.2 | -0.02em | 600 |
| H4 | Geist | 20 / 24px | `clamp(1.25rem, calc(1.166667rem + 0.37037vw), 1.5rem)` | 1.3 | -0.01em | 600 |
| Body large | Geist | 18 / 20px | `clamp(1.125rem, calc(1.083333rem + 0.185185vw), 1.25rem)` | 1.6 | 0 | 400 |
| Body | Geist | 16 / 18px | `clamp(1rem, calc(0.958333rem + 0.185185vw), 1.125rem)` | 1.6 | 0 | 400 |
| Small | Geist | 14 / 16px | `clamp(0.875rem, calc(0.833333rem + 0.185185vw), 1rem)` | 1.5 | 0 | 400 |
| Caption | Geist | 12 / 14px | `clamp(0.75rem, calc(0.708333rem + 0.185185vw), 0.875rem)` | 1.45 | 0.01em | 500 |

UI text styles:

| Style | Font | Size | Weight | Line height |
| --- | --- | --- | --- | --- |
| Button | Geist | 1rem | 600 | 1.25 |
| Form label | Geist | 0.875rem | 500 | 1.4 |
| Input | Geist | 1rem | 400 | 1.5 |
| Data value | Geist Mono | 24 to 32px fluid | 500 | 1.15 |
| Timestamp | Geist Mono | 12 to 14px fluid | 500 | 1.4 |

Type rules:

- Sentence case everywhere; don't copy the logo's lowercase.
- Reading copy runs 50 to 65 characters a line.
- Let translated labels wrap.
- Use `overflow-wrap: anywhere` on user names.
- No faux italics.

### Surfaces, radii, borders, focus, shadows

Source: `05-visual-language/01-guide/Worldling-Visual-Language.md` (UI surfaces) and `04-style-files/*`.

| Property | Value |
| --- | --- |
| Radius sm / md / lg / full | 8px / 16px / 24px / 9999px |
| Glass | `rgb(17 18 43 / 88%)`, backdrop blur 20px |
| Glass fallback | Opaque Deep Space `#11122B` |
| Panel padding | 20px mobile, 24px desktop |
| Spacing grid | 4px base; favor 8, 12, 16, 24, 32, 48 |
| Decorative border | 1px Line `#34365A` |
| Control border on opaque dark | 1px Control Line `#696C91` |
| Control border on glass | 1px Dust `#9A9BB8` |
| Focus | 2px solid Aurora `#3FE0C5`, 3px offset |
| Panel shadow | `0 16px 48px rgb(0 0 0 / 32%)` plus inner light `inset 0 1px 0 rgb(244 241 234 / 4%)` |
| Dialog shadow | `0 24px 80px rgb(0 0 0 / 45%)` |
| Selected-world glow | `0 0 24px rgb(63 224 197 / 12%)` |
| Main action | Sunrise fill, Void label, 48px min height, pill |
| Icon-only target | 44 x 44px min |

Glass rules:

- One glass layer per region; no nested blur.
- Text, icons and required borders stay fully opaque.
- Never lower a whole panel's opacity.

### Motion

Source: `05-visual-language/01-guide/Worldling-Visual-Language.md` (Motion).

| Motion | Duration | Easing | Movement | Reduced motion |
| --- | --- | --- | --- | --- |
| Hover or focus color | 150ms | `cubic-bezier(0.2, 0.8, 0.2, 1)` | Color or border only; focus is instant | Color change, 100ms or instant |
| Press feedback | 100ms (release 150ms) | `cubic-bezier(0.4, 0, 1, 1)` | Scale 1 to 0.985 | Color only |
| Panel entrance | 240ms (exit 180ms) | `cubic-bezier(0.2, 0.8, 0.2, 1)` | Fade in, rise 8px | 150ms fade |
| World focus | 600ms | `cubic-bezier(0.45, 0, 0.55, 1)` | Camera shift at most 8% of viewport, no roll | 150ms crossfade |
| Comet arrival | 900ms | `cubic-bezier(0.22, 0.61, 0.36, 1)` | One short curve, up to 140px | 150ms fade |
| Bloom reveal | 1200ms | `cubic-bezier(0.45, 0, 0.55, 1)` | Fade in, scale 0.96 to 1 | 150ms fade |
| Ambient drift | 16000ms cycle | `cubic-bezier(0.45, 0, 0.55, 1)` | 0 to -4px to 0, one world | None |
| Planet rotation | 120000ms per turn | `linear` | Optional | Static, manual step controls |
| Moon orbit | 90000ms per orbit | `linear` | Optional | Moon at rest |

Named easings in the recipes:

| Name | Curve |
| --- | --- |
| out | `cubic-bezier(.2, .8, .2, 1)` |
| in-out | `cubic-bezier(.45, 0, .55, 1)` |

Motion principles:

- Feedback is immediate.
- No bounce, overshoot, camera roll, flashing stars or shaking errors.
- One ambient animation per view, paused when hidden.
- A persistent Pause motion control that survives navigation.

### Icons and backgrounds

Source: `worldling-visual-language.json`, `03-icons/README.md`.

**Icons:**

| Property | Value |
| --- | --- |
| Grid | 24 |
| Stroke | 1.75px (1.5px for the 16px optical set) |
| Caps and joins | Round |
| Sizes | 16, 20, 24, 32 |
| Color | `currentColor` |
| Set | world, comet, visit, bloom, universe, share, settings, notification |

**Space background:** base Void.

| Element | Value |
| --- | --- |
| Stars | Round dots, 24 to 40 per megapixel, radius 0.6 to 1.5px, opacity 0.24 to 0.55, static |
| Nebula tint | Max 8% |
| Grain | Max 1.5%, static, behind content only |

Keep the area under copy calm.

### Logo

Sources: `02-logo/05-guidelines/REBUILD.md`, `07-source/worldling-geometry.json`.

**Geometry:**

| Part | Value |
| --- | --- |
| Artboard | 1024 |
| Planet | Circle (512, 590), r 216 |
| Orbit ellipse | rx 394, ry 100, rotated -19° about the planet center |
| Orbit stroke | 22 |
| Gap | 12 each side (knockout stroke 46) |
| Rear clearance | r 226 |
| Sprout | 3 filled paths (two leaves and a stem); the right leaf is about 15% larger and lifted 5° |

**Optical variants** (viewBox `80 80 864 864`):

| Size | Stroke | Gap | Rear clearance | Sprout scale |
| --- | --- | --- | --- | --- |
| 32px | 30 | 22 | +14 | 1.04 |
| 16px | 48 | 34 | +18 | 1.12 |

**Wordmark:** `worldling` in lowercase, Bricolage wght 650, wdth 100, opsz 48, tracking -0.025em, 0.8-unit soft outline. It is outlined, so never retypeset it.

**Approved fills:**

| Mark | Background |
| --- | --- |
| Starlight | Void |
| Void | Starlight |
| `#FFFFFF` | Transparent |
| Void | Transparent |
| Nebula | Transparent |
| Gradient (hero only) | Transparent |

**Clear space:** 108 units, a quarter of the planet diameter, scaled with the mark.

**Minimum digital sizes:**

| Asset | Minimum |
| --- | --- |
| Mark | 48px (use the optical files at 32 and 16) |
| Horizontal lockup | 160px |
| Stacked lockup | 128px |
| Gradient hero mark | 128px |

**Don'ts:**

- Don't stretch or rotate it.
- Don't recolor parts.
- No shadows, glows or outlines.
- No busy backgrounds.

### Email layout

Sources: `06-applications/02-svg/Worldling-Email-*.svg`, `06-source/copy-and-layout.json`.

| Property | Value |
| --- | --- |
| Width | 600px desktop, 360px mobile |
| Side padding | 32px desktop, 24px mobile |
| Background | Void |
| Heading | Bricolage, 35px desktop, 34px mobile |
| Greeting | Geist bold 18px |
| Body | Geist 16px, Starlight |
| Note text | Geist 15px, Dust |
| Sign-off | Geist medium 18px, then Geist 14px |
| Button | Sunrise pill, 48px tall, Void label in Geist bold 16px |
| Footer links | Geist medium 13px, Nebula 300, underlined ("Email preferences", "Unsubscribe") |

Live HTML text, logo as image (per `06-applications/README.md`).

### Voice

Source: `07-voice/Worldling-Voice-and-Tone.md`.

**Voice:** "Wonder in the invitation. Clarity in the action." Five principles:

1. Make wonder feel close.
2. Be clear when it matters.
3. Invite at their pace.
4. Celebrate care and connection.
5. Use warm, everyday language.

**Tone by moment:**

| Moment | Tone |
| --- | --- |
| Discovery | Curious |
| Creation | Encouraging and practical |
| Error | Calm and direct |
| Celebration | Warm and specific |
| Notification | Brief and useful |

**Words:**

| Use | Avoid |
| --- | --- |
| world, planet, comet (explain at first use), grow, bloom ("Bloom level"), visit, explore, tend, people/friends/visitors, save, send, try again | realm, orb, ping, grind, rank up, raid, farm, users, epic, execute |

**Rules:**

- Sentence case; buttons start with a verb.
- No em dashes.
- No space jokes on failure.
- Never call a world lonely or neglected.
- Don't promise what the app hasn't confirmed.
- No all-caps excitement.
- French uses a friendly *tu*.

**Taglines:** the primary tagline is "Grow a world of your own." The secondary line is "Visit everyone else's."

### Differences from the current code (resolved)

All rows below were resolved on 2026-10-18 by the brand pass (ADR-018): `tokens.css` now carries the 08 values, components use the 08 type scale and shadows, `logo.tsx` comments point at `02-logo/`, and `src/app/apple-icon.png` is the square-source 1024px icon. The table records what changed.

| Value | Brand | `src/styles/tokens.css` / SPEC §3.2 |
| --- | --- | --- |
| `radius-md` | 16px | 0.875rem (14px) |
| `radius-lg` | 24px | 1.375rem (22px) |
| Glass fill | `rgb(17 18 43 / 88%)` | Deep Space at 62% (fails contrast, see below) |
| Glass blur | 20px | `--blur-glass: 1rem` (16px) |
| Focus offset | 3px | `--focus-ring-offset: 2px` |
| Ease out | `cubic-bezier(0.2, 0.8, 0.2, 1)` | `cubic-bezier(0.16, 1, 0.3, 1)` |
| Ease in-out | `cubic-bezier(0.45, 0, 0.55, 1)` | `cubic-bezier(0.65, 0, 0.35, 1)` |
| UI durations | 100, 150, 180, 240ms; 600 to 1200ms for world moments | 160, 260, 480ms; flight 1600ms |
| Shadows | Panel, dialog, selected-world glow (three) | One `--shadow-raised` |
| Type scale | 9 named levels with weights and tracking (above) | `xs` to `display`; `text-xs` is 13px, display tops out at 88px |
| Required control border on glass | Dust | Not a token yet |
| Path comments | | `tokens.css` line 3 and `src/components/shared/logo.tsx` line 5 still name the old `Worldling-brand-colors/` and `Worldling-Logo-Kit/` folders |
| Apple touch icon | Square source for platforms that round the icon | `src/app/apple-icon.png` is the pre-rounded 512px icon, so iOS shows its transparent corners on top of its own mask |

## Logo check

`02-logo/` already has SVGs for every lockup, mark, app icon and favicon. Its shapes are circles, an ellipse and simple filled paths, with luminance masks for the gaps. No new SVGs were drawn.

Names asked for in the brand setup task, mapped to the existing files:

| Asked for | Use |
| --- | --- |
| `mark.svg` | `02-marks/svg/worldling-mark-starlight-on-void.svg` (on dark) or `worldling-mark-primary-nebula.svg` (color, transparent) |
| `mark-mono-light.svg` | `02-marks/svg/worldling-mark-white-transparent.svg` |
| `mark-mono-dark.svg` | `02-marks/svg/worldling-mark-dark-transparent.svg` |
| `lockup-horizontal.svg` | `01-logos/svg/worldling-horizontal-{on-dark,on-light,white-transparent,dark-transparent}.svg` |
| `lockup-stacked.svg` | `01-logos/svg/worldling-stacked-{on-dark,on-light,white-transparent,dark-transparent}.svg` |

### SVG and PNG comparison

All 26 SVG/PNG pairs were rendered with Chromium at each PNG's own size and diffed against the supplied PNG, composited on grey (0 to 255 per channel).

| Group | Mean difference | Pixels off by more than 32 |
| --- | --- | --- |
| Lockups (8) | 0.04 to 0.09 | at most 0.06% |
| Marks (6) | 0.01 to 0.09 | at most 0.06% |
| App icon (3) | 0.28 to 0.36 | at most 0.07% |
| Favicons 64 and 1024 (3) | 0.09 to 1.3 | at most 0.6% |
| Favicons 16 and 32 (6) | 1.3 to 5.6 | 0 to 4.7% |

Large assets match. The small favicons differ only in antialiasing of single edge pixels (renderer rounding at 16 and 32px), not in shape. Their PNGs are the hinted references; use those for raster frames.

### 16px check

The mark, the 16 and 32px optical files and the direct reductions were rendered on Void and on Starlight at 16, 32 and 48px and viewed enlarged.

- **16px optical (`worldling-16.svg`, `worldling-transparent-16.svg`):** reads. The ringed planet is clear, the ring gap shows as a dark line across the planet, and the sprout is a small two-leaf tuft.
- **16px direct reduction:** the ring thins and breaks and the gap closes. This confirms the kit's rule: use the optical files at 16 and 32px.
- **48px master:** reads well on both backgrounds, as specified.
- **Gap found (still pending brand, 08 doesn't add it):** the transparent optical favicons (`worldling-transparent-16/32/64`) exist only in Starlight. They disappear on light backgrounds. A light page or light browser tab at 16 or 32px has no matching asset; the dark master at that size loses its ring gap. **Pending brand:** a Void-on-transparent optical variant at 16 and 32px. The shipped `favicon.svg` and `.ico` carry their own Void backdrop, so browser tabs are fine today.

## Contrast check

Method: WCAG 2.2 relative luminance from the canonical HEX, unrounded ratios, pass or fail on the full value. Text needs 4.5:1 (AA normal) or 3:1 (AA large, 24px or 18.67px bold). Required non-text boundaries and focus indicators need 3:1.

**Cross-check:** all 55 pairs published in `Worldling-Color-System.md` were recomputed. All 55 matched to two decimals.

### Text on dark surfaces

| Text | Void | Deep Space | Orbit |
| --- | --- | --- | --- |
| Starlight | 17.66 | 16.26 | 14.75 |
| Dust | 7.35 | 6.77 | 6.15 |
| Nebula 300 (link) | 8.62 | 7.94 | 7.20 |
| Nebula 500 | 5.17 | 4.76 | **4.32 fail** (large only) |
| Aurora | 12.03 | 11.07 | 10.05 |
| Sunrise | 8.57 | 7.89 | 7.16 |
| Success | 12.06 | 11.10 | 10.08 |
| Warning | 12.71 | 11.71 | 10.62 |
| Danger | 8.06 | 7.42 | 6.73 |
| Info | 9.54 | 8.78 | 7.97 |

### Text on status surfaces

| Surface | Status color | Starlight | Dust |
| --- | --- | --- | --- |
| Success `#1B2B3A` | 8.75 | 12.81 | 5.34 |
| Warning `#2C2832` | 9.20 | 12.78 | 5.32 |
| Danger `#2E1F37` | 6.21 | 13.62 | 5.67 |
| Info `#202544` | 7.13 | 13.21 | 5.50 |

All pass AA.

### Labels on filled controls

| Fill | Void label | Starlight label |
| --- | --- | --- |
| Nebula 400 | 6.49 | **2.72 fail** |
| Nebula 500 | 5.17 | **3.42 fail** (large only) |
| Nebula 600 | **3.53 fail** (large only) | 5.00 |
| Aurora 500 | 12.03 | **1.47 fail** |
| Sunrise 400 | 9.80 | **1.80 fail** |
| Sunrise 500 | 8.57 | **2.06 fail** |
| Sunrise 600 | 5.77 | **3.06 fail** (large only) |
| Danger | 8.06 | **2.19 fail** |
| Success | 12.06 | **1.46 fail** |
| Warning | 12.71 | **1.39 fail** |
| Info | 9.54 | **1.85 fail** |

Void is the label on every bright fill. This matches the `on-*` tokens already in code.

### Text on glass

Glass was composited over the worst backdrop a 3D scene can put behind it. The backdrops tested were Void, a Starlight-bright planet, pure white, Sunrise, Aurora and Frozen snow `#E8EDEF`. The table shows the worst case (white).

| Text | Brand glass 88% over white (`#2E2E44`) | Code glass 62% over white (`#6B6C7C`) |
| --- | --- | --- |
| Starlight | 11.71 | 4.58 (barely passes) |
| Dust | 4.88 | **1.91 fail** |
| Nebula 300 | 5.72 | **2.24 fail** |

- **Brand 88% glass:** Starlight, Dust and Nebula 300 pass AA over every backdrop tested. The lowest is Dust over white at 4.88.
- **Code 62% glass:** Dust fails over every bright backdrop (1.91 to 3.20). Nebula 300 fails too (2.24 to 3.75). Starlight drops to 4.58 over white.
- **Code scrim:** Void at 72% over white is `#4C4C5A`. Dust on it is **3.12, fail**.

### Non-text boundaries and focus

| Indicator | Against | Ratio | 3:1 |
| --- | --- | --- | --- |
| Line | Void / Deep Space / Orbit | 1.73 / 1.59 / 1.44 | Fail (decorative only, as specified) |
| Control Line | Void / Deep Space / Orbit | 3.94 / 3.63 / 3.29 | Pass |
| Control Line | Brand glass over bright backdrops | 2.61 to 3.04 | **Fails** over white, snow, Starlight and Aurora. On glass use Dust, as the brand specifies |
| Dust (glass control border) | Brand glass over all backdrops | 4.88 to 6.84 | Pass |
| Dust | Code 62% glass over bright backdrops | 1.91 to 3.20 | **Fail** |
| Aurora focus ring | Void / Deep Space / Orbit | 12.03 / 11.07 / 10.05 | Pass |
| Aurora focus ring, touching a fill | Aurora / Sunrise / Nebula / Danger fills | 1.00 / 1.40 / 2.33 / 1.49 | **Fail.** The ring needs its offset gap so the surface sits between ring and fill |
| Aurora focus ring | Starlight (light pages) | 1.47 | **Fail** |

### Do not use

These failing pairs are already ruled out by the brand. No fix is needed; don't use them.

- Nebula 500 as normal-size text on Orbit (use Nebula 300).
- Starlight labels on any bright fill (use Void).
- Void label on Nebula 600 (keep Nebula at 500 when pressed).
- Line as the only boundary of a control.
- Control Line on glass (use Dust).
- An Aurora focus ring with no gap around Aurora, Sunrise, Nebula or Danger fills.
- Dust on Starlight.

### Adjusted values

These pairs are needed by the SPEC but fail. Each fix keeps the hue and saturation, only lowering lightness until the pair passes with a 0.1 margin. They are recommendations for the tokens step; nothing in code changed.

1. **Glass behind text (SPEC §3.1).** Use the brand's 88% glass with 20px blur, not 62%. Over the worst backdrop it keeps Dust at 4.88 and links at 5.72. If a lighter glass is ever wanted, put an opaque Deep Space scrim behind text.

2. **Light theme, for static pages and admin (SPEC §3.1).** The brand gives only Void text and Nebula 700 links on Starlight. Status and muted colors need darker variants:

   | Role on Starlight `#F4F1EA` | Brand color | Ratio | Adjusted | New ratio |
   | --- | --- | --- | --- | --- |
   | Muted text | Dust `#9A9BB8` | 2.40 | `#686994` | 4.61 |
   | Success text | `#68DFA9` | 1.46 | `#1A7C50` | 4.60 |
   | Warning text | `#F4C969` | 1.39 | `#8E650A` | 4.64 |
   | Danger text | `#FF7B91` | 2.19 | `#DB0025` | 4.61 |
   | Info text | `#8AB4FF` | 1.85 | `#035DFF` | 4.64 |
   | Focus ring | Aurora `#3FE0C5` | 1.47 | Aurora 700 `#1E8C7C` (existing step) | 3.65 |
   | Link | Nebula 500 | 3.42 | Nebula 700 `#503EAF` (brand rule) | 7.03 |
   | Control border | Control Line `#696C91` | 4.48 | No change needed | 4.48 |

   The Danger and Info values are fully saturated. Step 8 may prefer to tune them for feel; any replacement still needs 4.5:1 or more.

**In code:** `src/styles/contrast.test.ts` recomputes the pairs the UI uses (text, muted and link on every dark surface, status on status surfaces, Void on every fill including warm hover and pressed, the 88% glass over white, snow, Starlight, Sunrise and Aurora, control and focus boundaries) from `worldling.tokens.json` on every test run. No brand pair needed a lightness adjustment for the dark UI; the 88% glass is the brand's own fix for the old 62% glass.

**Email logo:** `public/brand/email/worldling-horizontal-on-dark@2x.png` is `02-logo/01-logos/png/worldling-horizontal-on-dark@2x.png` resized to 364px wide (2x the 182px email logo), with its Void background kept so mail clients that recolor can't hide it.

The audit script that produced the original numbers is not kept in the repo. Re-run the brand's own `03-color/04-source/audit_colors.py` for the published pairs.
