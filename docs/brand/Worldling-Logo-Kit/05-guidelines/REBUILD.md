# Worldling: exact logo construction

All coordinates are SVG user units. SVG uses a downward-positive y axis. The canonical artboard is `0 0 1024 1024`. Paths are filled unless specified otherwise.

## Core circle and orbit

| Element | Value |
| --- | --- |
| Planet center | (512, 590) |
| Planet radius / diameter | 216 / 432 |
| Orbit center | (512, 590) |
| Orbit ellipse radii | rx 394, ry 100 |
| Orbit diameters | 788 x 200 |
| Orbit rotation | `rotate(-19 512 590)` |
| Visual direction | 19 degrees above horizontal, rising right |
| Orbit stroke | 22 |
| Foreground gap on either side | 12 |
| Foreground knockout stroke | 22 + 2 x 12 = 46 |
| Rear clearance | Mask out the circle at radius 226 |

Front half path, before rotation:

```svg
M 906,590 A 394,100 0 0 1 118,590
```

Back half path, before rotation:

```svg
M 118,590 A 394,100 0 0 1 906,590
```

The render draws the entire ellipse behind the planet, masked outside radius 226, then draws the foreground half again on top. This deliberate overlap prevents antialias seams at the endpoints. The ring has a uniform normal stroke width. Do not flatten it into a generic swoosh.

## Exact sprout paths

Left leaf:

```svg
M 512,334 C 460,340 414,308 400,260 C 451,251 497,279 512,334 Z
```

Right leaf:

```svg
M 516,329 C 572.1,330.6 618.3,292.1 628.8,239.4 C 573.4,234.6 526.9,268.8 516,329 Z
```

Stem:

```svg
M 501,384 C 504,356 499,339 487,326 L 507,317 Q 516,328 525,315 L 537,323 C 520,341 521,361 523,384 Z
```

The right leaf is a rounded-coordinate transformation of the mirrored left leaf: about 1.072 linear scale and an additional 5-degree lift. Its area is about 15% greater. The two roots meet the short stem; the stem overlaps the circle. Use a single fill, no stroke.

## Layer order and real transparency

1. Draw the elliptical ring, stroke 22, no fill. Apply a luminance mask that hides it within the circle of radius 226.
2. Draw the filled planet and all three sprout paths. Apply a luminance mask to this group: a white full-artboard rectangle, then a black front arc at stroke 46. This cuts the ring plus its even clear gap out of the circle.
3. Draw the front arc at stroke 22 over the result.
4. Keep masks as masks, or convert them to boolean path differences in your vector editor. Do not paint the gap in white or in the background color.

## Wordmark

- Exact spelling: `worldling`, lowercase.
- Font source: Bricolage Grotesque variable. Axis values: `wght=650`, `wdth=100`, `opsz=48`.
- Nominal em: 200 units. Letter spacing: -5 units, or -0.025em.
- Font kerning is captured into the supplied glyph origins. Do not add a second tracking or kerning pass.
- Apply a same-color 0.8-unit outline with round joins for a small amount of terminal softening. Expand the stroke if the delivery system requires fill-only paths.
- Visible bounds before normalization: `[2.7571166992187504, -144.75701904296875, 821.3284423828125, 34.157049560546874]`.
- Visible dimensions before the soft outline: 818.571326 x 178.914069 units.
- Glyph x origins at this em: `[0, 158.0, 270.8, 347.4, 391.8, 507.8, 552.2, 597.0, 710.6]`.
- Shift the path by the negative of its xMin/yMin to place its top-left at zero, then position it as specified below.
- The complete path is in `07-source/worldling-geometry.json`, and every lockup includes the same outlined path. Those files are the exact rendering reference.

## Asset construction map

| Asset | Canvas / viewBox | Mark | Wordmark or background |
| --- | --- | --- | --- |
| Master mark, every color | 1024 x 1024 / 0 0 1024 1024 | Untransformed canonical mark | Same geometry; substitute approved fill only |
| Horizontal, every color | 1331 x 360 | translate(0 -14.56) scale(.38) | Normalized wordmark top-left (440, 90.542966), scale 1 |
| Stacked, every color | 800 x 720 | translate(92.8 -48) scale(.6) | Normalized top-left (100,505), scale 0.732984385; visible width 600 |
| Rounded app icon | 1024 x 1024 | translate(71.68 71.68) scale(.86) | Corner radius 224; gradient below |
| Square app source | 1024 x 1024 | Same as rounded icon | Corner radius 0 |
| 64px mark | 64 x 64 / 0 0 1024 1024 | Canonical master | Void backdrop or transparent variant |
| 32px favicon | 32 x 32 / 80 80 864 864 | Stroke 30; gap 22; rear clearance 14; sprout scale 1.04 at (512,374) | Void backdrop or transparent variant |
| 16px favicon | 16 x 16 / 80 80 864 864 | Stroke 48; gap 34; rear clearance 18; sprout scale 1.12 at (512,374) | Void backdrop or transparent variant |
| favicon.svg | Same as 32px | 32px optical geometry | Fixed Void backdrop |
| favicon.ico | 16, 32, 64 raster frames | Each frame uses its matching geometry | Fixed Void backdrop |

SVG transforms are written as SVG transform lists. A point is first scaled, then translated by the listed outer translation. Do not scale the translation values again.

## Approved fills

| Expression | Mark / wordmark | Background |
| --- | --- | --- |
| On dark | Starlight #F4F1EA | Void #07071A |
| On light | Void #07071A | Starlight #F4F1EA |
| White transparent | #FFFFFF | Alpha |
| Dark transparent | #07071A | Alpha |
| Primary color mark | Nebula #7C6CFF | Alpha |
| Full color / hero | Linear gradient #7C6CFF to #3FE0C5 | Alpha |

Hero gradient uses `gradientUnits="userSpaceOnUse"`, start `(160,790)`, end `(864,250)`, with stops at 0 and 1. The same global gradient is applied to all parts, so they align. Do not use the hero gradient below 128px, in a favicon, or on the wordmark.

The app icon background uses a linear gradient from the bottom-left to the top-right: #30275A at 0%, #202544 at 56%, #1B484B at 100%. The app icon mark remains Starlight. No glow, noise, shadow, or bevel is added.

## Clear space and minimum sizes

Let x = 108 master units, or one quarter of the 432-unit planet diameter. Keep at least x of empty space beyond every outer visible edge of the mark or complete lockup. Scale x with the mark. The fixed gap between mark and wordmark is part of the lockup and is not adjusted by this outside-clear-space rule.

| Asset | Minimum digital width | Suggested minimum print width |
| --- | --- | --- |
| Standard mark | 48 CSS px | 12 mm |
| Horizontal lockup | 160 CSS px | 40 mm |
| Stacked lockup | 128 CSS px | 32 mm |
| Gradient hero mark | 128 CSS px | 32 mm |
| Optical favicon | Exact 32 or 16 CSS px | Digital only |

These print minima are starting specifications, not press proofs. Confirm reproduction on the intended paper and process. Do not use print color conversion values as part of this Step 2 kit.

## Four don'ts

1. Do not stretch, rotate the whole lockup, or change its fixed proportions.
2. Do not recolor individual parts or substitute unapproved colors or gradients.
3. Do not add drop shadows, glow, outlines, bevels, or 3D effects to the logo.
4. Do not place it on busy or low-contrast backgrounds. Give it a quiet solid area.

## Pixel testing

The size proof exports were inspected at their real raster dimensions and as nearest-neighbor enlargements. Use the optical versions at 16px and 32px. At 16px the sprout is a simple two-leaf silhouette; its modest asymmetry is mainly visible at larger sizes. The comparison files named `direct-reduction` are included to show why the correction is needed and are not the recommended favicon assets.

## Font sources

- Bricolage Grotesque: https://github.com/ateliertriay/bricolage
- Distributed original variable build: https://github.com/google/fonts/tree/main/ofl/bricolagegrotesque
- Geist: https://github.com/google/fonts/tree/main/ofl/geist
- Geist Mono: https://github.com/google/fonts/tree/main/ofl/geistmono

Original font binaries and OFL license files are included. The wordmark is supplied as paths. No modified font binary is distributed.
