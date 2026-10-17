# Worldling: Step 6 applications

The approved identity, applied to social sharing, launch graphics, product screens and email. One signature world connects the set: a painterly, living miniature with turquoise water, soft greenery and a small cream cloud.

## Start here

- `01-images`: finished PNGs at their delivery dimensions.
- `02-svg`: matching SVG layouts with outlined text and embedded artwork.
- `03-guide`: the application guide, overview and dimension index.
- `04-assets`: artwork, approved logo, eight icons, original fonts and font licenses.
- `05-template/og-template.json`: editable share-template content.
- `06-source`: rebuild scripts and an exact copy inventory.

## Deliverables

| Application | PNG dimensions | Notes |
| --- | --- | --- |
| Open Graph share template | 1200 x 630 | World name, @username, planet and approved logo |
| X header | 1500 x 500 | Quiet lower-left area for profile overlap |
| Instagram launch post | 1080 x 1350 | Launch announcement and original tagline |
| Instagram launch story | 1080 x 1920 | Centered layout with generous top and bottom space |
| Mobile world page | 1170 x 2532 | 390 x 844 logical pixels, rendered at 3x |
| Desktop world creator | 1600 x 1000 | Planet, six presets, sliders and color swatches |
| Email desktop preview | 1200 x 1318 | 600-pixel logical width, rendered at 2x |
| Email mobile preview | 720 x 1438 | 360-pixel logical width, rendered at 2x |
| Email desktop header / footer | 1200 x 416 / 1200 x 308 | Separate image pieces |
| Email mobile header / footer | 720 x 396 / 720 x 348 | Separate image pieces |

## Design decisions

Void gives the layouts their calm foundation. Starlight carries the main copy, Dust supports it, and Sunrise identifies the main action. Aurora marks small moments of growth. The exact approved sprouting-world logo appears throughout.

Headlines use Bricolage Grotesque 650. Geist handles body copy, labels and buttons. Geist Mono distinguishes bloom levels and slider values. Text in the SVGs is outlined, so the exported images do not depend on installed fonts or generated lettering.

The example world is **Éclats d’aurore**, owned by **Mira (@mira)**. These are fictional demonstration details. The launch art says **Worldling is here.** The supplied tagline and secondary line remain unchanged.

## Customize the share template

Edit `05-template/og-template.json`:

```json
{
  "world_name": "Éclats d’aurore",
  "username": "@mira",
  "planet_path": "04-assets/worldling-hero-world.png",
  "tagline": "Grow a world of your own."
}
```

Use a square transparent PNG for the planet. The template wraps the world name to at most two lines and reduces its size when needed. Check the new export visually after changing copy or artwork. A very long name will require a shorter display title or a deliberate layout adjustment.

From this folder, run:

```bash
python 06-source/build_applications.py
```

Requirements: Python with `fonttools` and `Pillow`, plus Inkscape on PATH. All artwork and fonts are included; rebuilding does not require network access. The script rebuilds all 12 PNGs and their SVG sources. The shared hero artwork is used across the application set.

The source stores text as Unicode strings. Edit those strings when changing product or campaign copy. The supplied SVG text is outlined for faithful display, not editable as live text.

## Use the layouts

The social files are finished image compositions. A drawn button is visual campaign copy. Add the destination using the publishing surface's available link controls when posting.

The mobile and desktop images are static product mockups. The creator shows the six worlds from Step 5, with Verdant selected. The controls and bloom level illustrate the interface and are not a working application.

The email files are visual designs at desktop and mobile widths. When building the email, use live HTML for headings, body copy, buttons and footer links. Keep the logo as an image and preserve reading order. Connect the actual destinations for preferences, unsubscribe and the main action during implementation.

The original font files and their OFL notices are included in `04-assets`. The hero world is a concept illustration for this application set; it is not a render of a production 3D scene.
