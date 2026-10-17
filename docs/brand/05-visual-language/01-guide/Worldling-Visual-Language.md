# Worldling: Step 5 visual language

## The direction

The universe is vast, but every world should feel small enough to hold. Planets are tactile, softly lit dioramas. The interface stays quiet around them. Small details suggest life without turning the product into a toy shop.

## Six-world moodboard

The moodboard uses one consistent camera and light direction. Read left to right, top to bottom: Oceanic, Verdant, Desert, Frozen, Volcanic, Crystal. It is concept art, not a set of production 3D meshes.

| World | French label | Main forms | Material | Art color suggestions |
| --- | --- | --- | --- | --- |
| Oceanic | Océanique | Three readable islands and broad shallow-water bands. | Satin ocean, matte sand, sparse foam. | #245D82, #69C9C2, #E4D8B3 |
| Verdant | Verdoyant | Rounded canopies, a winding river and quiet clearings. | Soft moss, brushed grass, muted stone. | #63804E, #9FAF65, #4DA5AC |
| Desert | Désertique | Dune ribbons, rounded mesas and one small oasis. | Powdery sand, soft terracotta rock. | #BD7954, #E9B682, #78BDB2 |
| Frozen | Gelé | Broad snow caps, pale lakes and softened ice ridges. | Powder snow and translucent satin ice. | #729CAF, #BEDFE4, #E8EDEF |
| Volcanic | Volcanique | Rounded basalt, a quiet crater and a few warm seams. | Matte mineral rock; restrained lava emission. | #4B4957, #A16658, #F28D60 |
| Crystal | Cristallin | Few clustered crystals around a shallow teal pool. | Cloudy mineral translucency; no mirror finish. | #8C7AAF, #C4B8D8, #8BCBBB |

These colors guide the illustration and materials only. They do not replace or extend the Step 3 UI palette. The generated image is a visual reference, so its individual pixels will vary from these suggested swatches.

## 3D art direction

- Camera: near orthographic, roughly 25 degrees above the equator. Match world sizes and framing when comparing presets.
- Forms: a solid spherical base, rounded terrain and distinct broad regions. Preserve a clear silhouette. Choose up to three main landmarks for a hero world.
- Light: one large warm source from upper left, a cool fill at roughly one third of its energy, and soft ambient occlusion in terrain creases. Avoid hard black shadows and strong rim glow.
- Material: matte, hand-painted mineral or clay land; satin water; slightly translucent ice and crystals. Start around roughness 0.8 for land and 0.28 for water, metalness 0. Adjust for the renderer and lighting.
- Texture: broad painted variation, never noisy photographic terrain. Water glints and night lights are small accents. Lava is warm and contained.
- Growth: add a cloud, a quiet cluster of flowers, a few night lights or a small moon. Growth adds life without replacing the world's identity or filling every empty area.
- Hero, 480px and larger: fine brush variation and miniature vegetation can show. Cards, 160 to 479px: one or two landmarks and three to five broad color masses. Maps, 48 to 159px: silhouette and two or three color masses, without fine vegetation or tiny glints. Below 48px: use a simple world marker.
- Avoid faces on planets, hard sci-fi machinery, giant crystal spikes, glossy plastic, busy rings and photoreal satellite textures. The approved logo remains a separate flat mark.

## UI surfaces

| Property | Specification |
| --- | --- |
| Canvas | Void #07071A |
| Default panel | Deep Space #11122B, opaque |
| Raised surface | Orbit #1A1B3A, opaque |
| Glass option | rgb(17 18 43 / 88%), backdrop blur 20px |
| Blur fallback | Opaque Deep Space; preserve all text and borders |
| Small / medium / large radii | 8 / 16 / 24px |
| Pill radius | 9999px |
| Panel padding | 20px mobile, 24px desktop |
| Spacing | 4px base grid; favor 8, 12, 16, 24, 32 and 48px |
| Decorative panel border | 1px Line #34365A |
| Required control border on opaque dark panels | 1px Control Line #696C91 |
| Required control border on glass | 1px Dust #9A9BB8 |
| Panel shadow | 0 16px 48px rgb(0 0 0 / 32%) |
| Inner light | inset 0 1px 0 rgb(244 241 234 / 4%) |
| Dialog shadow | 0 24px 80px rgb(0 0 0 / 45%) |
| Selected-world glow | 0 0 24px rgb(63 224 197 / 12%) |
| Focus outline | 2px Aurora #3FE0C5 with a 3px offset |
| Main action | Sunrise fill, Void text, 48px minimum height |
| Icon-only target | At least 44 by 44px as a brand layout rule |

Keep text, icons and functional borders fully opaque. Apply alpha to the glass background only. Use one glass layer per region; avoid nested blur panels. Keep glow out of body copy and reserve it for one selected world or a small interaction detail. A focus outline must work without the glow.

The 88% glass fill can become lighter over bright art. In the simple worst-case sRGB composite over white, its displayed fill is approximately #2E2E44: Dust text is about 4.88:1, while Control Line is only about 2.61:1. That is why controls on glass use Dust borders. Do not lower the fill opacity or add saturation/brightness filters without checking contrast again. Recheck the implemented composition; these calculations do not certify the whole app.

## Iconography

- Master grid: 24 by 24. Stroke 1.75px, round caps and round joins. Aim for a 20 by 20 live area, with small optical exceptions.
- Use one foreground color and no gradients, internal shadows or glow. Fill is used only for tiny universe nodes. Match the visible weight, not just the numeric stroke.
- Display sizes: 20, 24 and 32px use the 24px master. At 16px, use the supplied simplified optical variant with a 1.5px stroke. Do not render smaller.
- Use the supplied icons for world, comet, visit, bloom, universe, share, settings and notification. The world icon is a UI symbol, not a replacement for the approved logo.
- Pair unfamiliar actions with a label. Visible icon-only controls need accessible names. Decorative icons inside labeled buttons should be hidden from assistive technology.
- SVGs use currentColor. Inline them or use the sprite with an explicit color. A separate img element does not inherit its parent's CSS color into the SVG file. The PNG copies are Starlight on transparency.
- Status and selection need a label or another visible cue as well as color. Keep names, accents and French labels intact.

## Illustration and backgrounds

Stars are circular dots, not five-point star symbols. Use 24 to 40 dots per megapixel at radius 0.6 to 1.5px, opacity 0.24 to 0.55. Keep them static. The supplied 1920 by 1080 background has 66 dots.

Nebula dust is one or two broad, low-contrast areas with a maximum 8% tint. Keep the center behind text quiet. The full-strength Nebula-to-Aurora gradient remains a rare hero accent.

Grain is static, monochrome and at most 1.5% opacity, in the background layer only. It should be felt before it is seen. Remove it in small or low-power views. Do not texture labels, icons or buttons.

Small spot illustrations use rounded circles and simple curves, two to four colors and one small life detail. Use them for empty states or supporting explanations. They should be simpler than the 3D planets. Do not flatten the main planet art into these small symbols.

| Do | Avoid |
| --- | --- |
| Preserve dark breathing room around worlds and words. | Dense constellations or bright nebula bands behind copy. |
| Keep stars sparse, tiny and still. | Giant stars, blinking decorations and particle storms. |
| Keep land matte and silhouettes rounded. | Plastic shine, harsh edges and neon outlines. |
| Use subtle grain behind content. | Visible noise over readable content. |
| Give a spot illustration one clear detail. | Piling terrain, weather, moons and effects into one small image. |

## Motion

- Give feedback immediately; never delay a successful action for an effect.
- Use short, calm interface transitions and slow ambient movement.
- No bounce, spring overshoot, camera roll, flashing stars or shaking errors.
- Use one featured ambient animation per view; pause it when hidden or offscreen.
- Respect reduced motion and provide a persistent Pause motion control for continuous ambient movement.

| Motion | Duration | Easing | Movement | Reduced motion |
| --- | --- | --- | --- | --- |
| Hover or focus color | 150ms | `cubic-bezier(0.2, 0.8, 0.2, 1)` | Color or border only. Focus appears immediately. | Keep color change, 100ms or instant. |
| Press feedback | 100ms | `cubic-bezier(0.4, 0, 1, 1)` | Scale 1 to 0.985. Release in 150ms. | Color change only; no scaling. |
| Panel entrance | 240ms | `cubic-bezier(0.2, 0.8, 0.2, 1)` | Opacity 0 to 1; move up 8px. Exit: 180ms. | 150ms opacity only. |
| World focus | 600ms | `cubic-bezier(0.45, 0, 0.55, 1)` | Camera shift at most 8% of viewport. No roll. | 150ms crossfade between stationary views. |
| Comet arrival | 900ms | `cubic-bezier(0.22, 0.61, 0.36, 1)` | One short curved path, up to 140px in the UI. | 150ms arrival fade; no trail or travel. |
| Bloom reveal | 1200ms | `cubic-bezier(0.45, 0, 0.55, 1)` | Opacity 0 to 1; new detail scales 0.96 to 1. | 150ms fade of the completed detail. |
| Ambient drift | 16000ms | `cubic-bezier(0.45, 0, 0.55, 1)` | Full cycle: 0px to -4px to 0px. One featured world. | Static position; no ambient animation. |
| Planet rotation | 120000ms | `linear` | One full turn around its own axis. Optional. | Static view, with manual step controls. |
| Moon orbit | 90000ms | `linear` | One full orbit. Small, constant speed. Optional. | Moon remains at its resting position. |

Duration values are design starting points. The 16-second drift is a full out-and-back cycle. Rotation and moon orbit use linear timing to avoid speeding up at the seam. Show a successful comet confirmation immediately; its arrival animation may continue afterward. Do not delay content or interaction until animation ends.

Keep camera travel optional. Provide a stationary or crossfade way to visit worlds when reduced motion is enabled. Respect the operating-system preference as well as the app setting. A persistent Pause motion control stops ambient movement across navigation. Do not resume it automatically after returning to the tab. Pause offscreen and hidden scenes to avoid unnecessary work.

For CSS and WebGL together, use a shared motion preference in application state. CSS media queries alone do not stop a 3D render loop or camera tween. The CSS file includes panel, bloom and drift recipes; comet paths, camera focus, axial rotation and moon orbits follow the table in the rendering engine.

## Files

- 01-guide: PDF and complete Markdown specification.
- 02-art-direction: the original six-world concept image and its generation prompt.
- 03-icons: eight SVG masters, eight 16px optical variants, a 24px sprite and transparent PNG previews.
- 04-style-files: visual-language JSON and CSS recipes.
- 05-previews: UI, icon and do/avoid boards plus a reusable quiet-space background. SVG text on these boards is outlined for dependable rendering.
- 06-source: audit results and the scope of validation.

This is Step 5. The logo, color and type systems from Steps 2 to 4 remain the source of truth. The complete application mockups follow in Step 6; the unified Tailwind theme follows in Step 8.

## Sources

- [WCAG 2.2: Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html)
- [WCAG 2.2: Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html)
- [MDN: prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- [MDN: backdrop-filter](https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter)
