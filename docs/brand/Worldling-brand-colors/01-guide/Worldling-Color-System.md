# Worldling: Step 3 color system

The palette keeps all eight original anchors. The deep navy surfaces make room for each person's world. Starlight keeps the interface warm, Nebula provides the brand signature, Aurora marks growth, and Sunrise draws attention to the main action.

## Final palette

All values are sRGB. HEX and RGB are exact; HSL values are rounded to one decimal and should not replace the canonical HEX in production.

| Name | HEX | RGB | HSL | Role |
| --- | --- | --- | --- | --- |
| Void | #07071A | 7, 7, 26 | 240.0deg 57.6% 6.5% | Main canvas; ink on bright filled controls. |
| Deep Space | #11122B | 17, 18, 43 | 237.7deg 43.3% 11.8% | Panels, cards, navigation and status containers. |
| Orbit | #1A1B3A | 26, 27, 58 | 238.1deg 38.1% 16.5% | Raised panels, menus and nested surfaces. |
| Starlight | #F4F1EA | 244, 241, 234 | 42.0deg 31.3% 93.7% | Headings, body copy and primary icons on dark. |
| Dust | #9A9BB8 | 154, 155, 184 | 238.0deg 17.4% 66.3% | Secondary copy, metadata and supporting labels. |
| Nebula | #7C6CFF | 124, 108, 255 | 246.5deg 100.0% 71.2% | Primary brand, selected controls and secondary actions. |
| Aurora | #3FE0C5 | 63, 224, 197 | 169.9deg 72.2% 56.3% | Growth details, bloom accents and focus color on dark. |
| Sunrise | #FF8A5B | 255, 138, 91 | 17.2deg 100.0% 67.8% | Main call to action: create a world or send a comet. |

## Supporting interface colors

Nebula 300 is the default link and selected-text color on all three dark surfaces. The original Nebula 500 stays as the brand anchor and filled-control color.

| Name | HEX | RGB | HSL | Role |
| --- | --- | --- | --- | --- |
| Nebula 300 | #A99FFF | 169, 159, 255 | 246.2deg 100.0% 81.2% | Default link and selected-text color on dark surfaces. |
| Line | #34365A | 52, 54, 90 | 236.8deg 26.8% 27.8% | Decorative separators only, never a required control boundary. |
| Control Line | #696C91 | 105, 108, 145 | 235.5deg 16.0% 49.0% | Visible input and control boundaries on dark surfaces. |

## Accent scales

Each family includes 50, 100, 200, 300, 400, 500, 600, 700, 800, 900 and 950. The exact original brand color is held at 500. The ramps are curated in sRGB and verified for descending relative luminance; the numbers are relative to each family, not equal perceived brightness across different families. A scale step alone does not guarantee text contrast.

### Nebula

| Name | HEX | RGB | HSL | Role |
| --- | --- | --- | --- | --- |
| Nebula 50 | #F3F1FF | 243, 241, 255 | 248.6deg 100.0% 97.3% | Near-white tint |
| Nebula 100 | #E8E3FF | 232, 227, 255 | 250.7deg 100.0% 94.5% | Light wash |
| Nebula 200 | #CBC2FF | 203, 194, 255 | 248.9deg 100.0% 88.0% | Soft tint |
| Nebula 300 | #A99FFF | 169, 159, 255 | 246.2deg 100.0% 81.2% | Light accent |
| Nebula 400 | #9182FF | 145, 130, 255 | 247.2deg 100.0% 75.5% | Bright hover fill |
| Nebula 500 | #7C6CFF | 124, 108, 255 | 246.5deg 100.0% 71.2% | Brand anchor |
| Nebula 600 | #6550DB | 101, 80, 219 | 249.1deg 65.9% 58.6% | Deeper active fill |
| Nebula 700 | #503EAF | 80, 62, 175 | 249.6deg 47.7% 46.5% | Strong dark accent |
| Nebula 800 | #3D3083 | 61, 48, 131 | 249.4deg 46.4% 35.1% | Dark accent |
| Nebula 900 | #2A2257 | 42, 34, 87 | 249.1deg 43.8% 23.7% | Subtle dark fill |
| Nebula 950 | #17132E | 23, 19, 46 | 248.9deg 41.5% 12.7% | Near-black accent fill |

### Aurora

| Name | HEX | RGB | HSL | Role |
| --- | --- | --- | --- | --- |
| Aurora 50 | #E9FCF6 | 233, 252, 246 | 161.1deg 76.0% 95.1% | Near-white tint |
| Aurora 100 | #CCF8ED | 204, 248, 237 | 165.0deg 75.9% 88.6% | Light wash |
| Aurora 200 | #A2F1DF | 162, 241, 223 | 166.3deg 73.8% 79.0% | Soft tint |
| Aurora 300 | #76EBD3 | 118, 235, 211 | 167.7deg 74.5% 69.2% | Light accent |
| Aurora 400 | #57E5CB | 87, 229, 203 | 169.0deg 73.2% 62.0% | Bright hover fill |
| Aurora 500 | #3FE0C5 | 63, 224, 197 | 169.9deg 72.2% 56.3% | Brand anchor |
| Aurora 600 | #28B49E | 40, 180, 158 | 170.6deg 63.6% 43.1% | Deeper active fill |
| Aurora 700 | #1E8C7C | 30, 140, 124 | 171.3deg 64.7% 33.3% | Strong dark accent |
| Aurora 800 | #196B61 | 25, 107, 97 | 172.7deg 62.1% 25.9% | Dark accent |
| Aurora 900 | #164E48 | 22, 78, 72 | 173.6deg 56.0% 19.6% | Subtle dark fill |
| Aurora 950 | #0C2D2A | 12, 45, 42 | 174.5deg 57.9% 11.2% | Near-black accent fill |

### Sunrise

| Name | HEX | RGB | HSL | Role |
| --- | --- | --- | --- | --- |
| Sunrise 50 | #FFF4ED | 255, 244, 237 | 23.3deg 100.0% 96.5% | Near-white tint |
| Sunrise 100 | #FFE5D7 | 255, 229, 215 | 21.0deg 100.0% 92.2% | Light wash |
| Sunrise 200 | #FFCDB6 | 255, 205, 182 | 18.9deg 100.0% 85.7% | Soft tint |
| Sunrise 300 | #FFB394 | 255, 179, 148 | 17.4deg 100.0% 79.0% | Light accent |
| Sunrise 400 | #FF9D75 | 255, 157, 117 | 17.4deg 100.0% 72.9% | Bright hover fill |
| Sunrise 500 | #FF8A5B | 255, 138, 91 | 17.2deg 100.0% 67.8% | Brand anchor |
| Sunrise 600 | #D96A40 | 217, 106, 64 | 16.5deg 66.8% 55.1% | Deeper active fill |
| Sunrise 700 | #AC4E2E | 172, 78, 46 | 15.2deg 57.8% 42.7% | Strong dark accent |
| Sunrise 800 | #823C26 | 130, 60, 38 | 14.3deg 54.8% 32.9% | Dark accent |
| Sunrise 900 | #5B2D21 | 91, 45, 33 | 12.4deg 46.8% 24.3% | Subtle dark fill |
| Sunrise 950 | #331B16 | 51, 27, 22 | 10.3deg 39.7% 14.3% | Near-black accent fill |

## Semantic colors

Use status colors only when the meaning is present. Do not use red for a routine pause or orange for success. Pair each state with an icon and clear wording so color is never the only signal.

| Name | HEX | RGB | HSL | Role |
| --- | --- | --- | --- | --- |
| Success | #68DFA9 | 104, 223, 169 | 152.8deg 65.0% 64.1% | Saved, delivered, completed or a healthy system state. |
| Warning | #F4C969 | 244, 201, 105 | 41.4deg 86.3% 68.4% | Needs attention; a recoverable limit or unsaved change. |
| Danger | #FF7B91 | 255, 123, 145 | 350.0deg 100.0% 74.1% | Failed action, destructive action or an error that needs repair. |
| Info | #8AB4FF | 138, 180, 255 | 218.5deg 100.0% 77.1% | Neutral guidance, updates and helpful status information. |

### Opaque status backgrounds

These are 12% of the semantic foreground composited over Deep Space, rounded to exact sRGB bytes and stored as opaque HEX. The measured foreground/background pairs are listed below. Do not apply a second opacity to them.

| Name | HEX | RGB | HSL | Role |
| --- | --- | --- | --- | --- |
| Success surface | #1B2B3A | 27, 43, 58 | 209.0deg 36.5% 16.7% | Opaque success message background; precomposed 12% color over Deep Space. |
| Warning surface | #2C2832 | 44, 40, 50 | 264.0deg 11.1% 17.6% | Opaque warning message background; precomposed 12% color over Deep Space. |
| Danger surface | #2E1F37 | 46, 31, 55 | 277.5deg 27.9% 16.9% | Opaque danger message background; precomposed 12% color over Deep Space. |
| Info surface | #202544 | 32, 37, 68 | 231.7deg 36.0% 19.6% | Opaque info message background; precomposed 12% color over Deep Space. |

## Contrast thresholds

For WCAG 2.2 color contrast, AA normal text requires 4.5:1, AAA normal text 7:1, AA large text 3:1 and AAA large text 4.5:1. Large text means at least 24 CSS px regular or 14pt bold, about 18.67 CSS px. Visual information needed to identify UI controls and states has a 3:1 non-text contrast requirement against adjacent colors. [1][2][3]

The pass/fail decisions below use the full unrounded ratio. Displayed ratios have two decimal places. A displayed rounded value does not change the underlying pass/fail result. These are contrast checks for the listed opaque pairs, not a claim that the complete application meets every WCAG criterion. [1][2]

### Text pairs

| Text | Background | Ratio | AA normal | AAA normal | AA large | AAA large |
| --- | --- | ---: | --- | --- | --- | --- |
| Starlight | Void | 17.66:1 | Pass | Pass | Pass | Pass |
| Starlight | Deep Space | 16.26:1 | Pass | Pass | Pass | Pass |
| Starlight | Orbit | 14.75:1 | Pass | Pass | Pass | Pass |
| Dust | Void | 7.35:1 | Pass | Pass | Pass | Pass |
| Dust | Deep Space | 6.77:1 | Pass | Fail | Pass | Pass |
| Dust | Orbit | 6.15:1 | Pass | Fail | Pass | Pass |
| Nebula | Void | 5.17:1 | Pass | Fail | Pass | Pass |
| Nebula | Deep Space | 4.76:1 | Pass | Fail | Pass | Pass |
| Nebula | Orbit | 4.32:1 | Fail | Fail | Pass | Fail |
| Nebula 300 | Void | 8.62:1 | Pass | Pass | Pass | Pass |
| Nebula 300 | Deep Space | 7.94:1 | Pass | Pass | Pass | Pass |
| Nebula 300 | Orbit | 7.20:1 | Pass | Pass | Pass | Pass |
| Aurora | Void | 12.03:1 | Pass | Pass | Pass | Pass |
| Sunrise | Void | 8.57:1 | Pass | Pass | Pass | Pass |
| Void | Nebula | 5.17:1 | Pass | Fail | Pass | Pass |
| Starlight | Nebula | 3.42:1 | Fail | Fail | Pass | Fail |
| Void | Aurora | 12.03:1 | Pass | Pass | Pass | Pass |
| Starlight | Aurora | 1.47:1 | Fail | Fail | Fail | Fail |
| Void | Sunrise | 8.57:1 | Pass | Pass | Pass | Pass |
| Starlight | Sunrise | 2.06:1 | Fail | Fail | Fail | Fail |
| Void | Starlight | 17.66:1 | Pass | Pass | Pass | Pass |
| Dust | Starlight | 2.40:1 | Fail | Fail | Fail | Fail |
| Nebula | Starlight | 3.42:1 | Fail | Fail | Pass | Fail |
| Nebula 700 | Starlight | 7.03:1 | Pass | Pass | Pass | Pass |
| Void | Sunrise 400 | 9.80:1 | Pass | Pass | Pass | Pass |
| Void | Sunrise 600 | 5.77:1 | Pass | Fail | Pass | Pass |
| Void | Nebula 600 | 3.53:1 | Fail | Fail | Pass | Fail |

### Status labels and icons

| Text | Background | Ratio | AA normal | AAA normal | AA large | AAA large |
| --- | --- | ---: | --- | --- | --- | --- |
| Success | Void | 12.06:1 | Pass | Pass | Pass | Pass |
| Success | Deep Space | 11.10:1 | Pass | Pass | Pass | Pass |
| Success | Orbit | 10.08:1 | Pass | Pass | Pass | Pass |
| Success | Success surface | 8.75:1 | Pass | Pass | Pass | Pass |
| Warning | Void | 12.71:1 | Pass | Pass | Pass | Pass |
| Warning | Deep Space | 11.71:1 | Pass | Pass | Pass | Pass |
| Warning | Orbit | 10.62:1 | Pass | Pass | Pass | Pass |
| Warning | Warning surface | 9.20:1 | Pass | Pass | Pass | Pass |
| Danger | Void | 8.06:1 | Pass | Pass | Pass | Pass |
| Danger | Deep Space | 7.42:1 | Pass | Pass | Pass | Pass |
| Danger | Orbit | 6.73:1 | Pass | Fail | Pass | Pass |
| Danger | Danger surface | 6.21:1 | Pass | Fail | Pass | Pass |
| Info | Void | 9.54:1 | Pass | Pass | Pass | Pass |
| Info | Deep Space | 8.78:1 | Pass | Pass | Pass | Pass |
| Info | Orbit | 7.97:1 | Pass | Pass | Pass | Pass |
| Info | Info surface | 7.13:1 | Pass | Pass | Pass | Pass |

### Non-text boundaries

| Boundary or indicator | Background | Ratio | Non-text AA |
| --- | --- | ---: | --- |
| Line | Void | 1.73:1 | Fail |
| Line | Deep Space | 1.59:1 | Fail |
| Line | Orbit | 1.44:1 | Fail |
| Control Line | Void | 3.94:1 | Pass |
| Control Line | Deep Space | 3.63:1 | Pass |
| Control Line | Orbit | 3.29:1 | Pass |
| Aurora | Void | 12.03:1 | Pass |
| Aurora | Deep Space | 11.07:1 | Pass |
| Aurora | Orbit | 10.05:1 | Pass |
| Nebula | Void | 5.17:1 | Pass |
| Nebula | Deep Space | 4.76:1 | Pass |
| Nebula | Orbit | 4.32:1 | Pass |

## Practical rules

1. Set main copy in Starlight and secondary copy in Dust. Dust passes AA on all three dark surfaces, but reaches AAA for normal text only on Void. Use Starlight for secondary copy if AAA on every surface is required.
2. Use Nebula 300 for links and selected text on dark surfaces. Nebula 500 passes AA normal text on Void and Deep Space, but fails it on Orbit. Keep links recognizable with an underline or another non-color cue.
3. Put Void text on Sunrise, Aurora and Nebula 500 filled buttons. Starlight on these fills fails AA for normal-size labels. Sunrise is the main CTA; Nebula is a supporting action.
4. A Sunrise button can use 500 at rest, 400 on hover and 600 when pressed, keeping Void text in all three states. All three labels pass AA normal text. These are color specifications, not the final component design.
5. Do not use Void text on Nebula 600 for a normal-size button label. Keep a Nebula action at 500 when pressed and express the pressed state through a non-color cue; the component design follows in Step 5.
6. Deep Space and Orbit are subtle surface layers, not sufficient control boundaries by themselves. Use Control Line for required input or control edges. Line is decorative and must not be the only cue identifying an interactive element.
7. Aurora is the focus color on dark. A dark separating gap is needed when a focus ring sits outside a bright filled control; its contrast must be checked against the actual adjacent colors. Focus visibility, size and occlusion still need separate evaluation.
8. Never reduce the opacity of important labels to achieve a muted effect. Use a tested opaque color. Recheck any text placed over translucent glass, a 3D planet, a gradient or animation, using the final composited colors and the worst background behind the text.
9. Use Void text and Nebula 700 links on Starlight light-background brand material. This provides a useful light treatment; it is not a complete light-mode UI system.

## Usage ratios

Treat these as a guide to visual emphasis in branded UI, not exact pixel measurements. Planet art can use its own world-specific colors. Status colors appear only when needed.

| Group | Ratio | Suggested distribution |
| --- | ---: | --- |
| Dark surfaces | 70% | Void 50%, Deep Space 15%, Orbit 5% |
| Neutral text and icons | 20% | Starlight 15%, Dust 5% |
| Brand accents | 10% | Nebula 5%, Aurora 3%, Sunrise 2% |

Keep one visually dominant Sunrise action per view. Use Nebula most often within the accent allowance. Aurora should feel like a small sign of life. Status colors replace some accent area rather than increasing the total color load.

## Signature gradient

The endpoints remain Nebula #7C6CFF and Aurora #3FE0C5. For general decorative surfaces use `linear-gradient(135deg, #7C6CFF 0%, #3FE0C5 100%)`. The approved hero logo keeps its Step 2 gradient coordinates. Use the gradient for a large hero mark, a short decorative line or a restrained artwork accent. Do not put normal body copy or the main CTA label directly over it; use a solid dark surface behind text. No text-on-gradient conformance claim is made here.

## Calculation method

For each 8-bit sRGB channel, set c = byte / 255. Linearize with c / 12.92 when c <= 0.04045, otherwise ((c + 0.055) / 1.055)^2.4. Relative luminance L = 0.2126 R + 0.7152 G + 0.0722 B. Contrast is (Llighter + 0.05) / (Ldarker + 0.05). Decisions use unrounded results. The included Python audit repeats the calculation from the canonical HEX values. [4]

## Sources

1. [WCAG 2.2 contrast minimum, SC 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
2. [WCAG 2.2 contrast enhanced, SC 1.4.6](https://www.w3.org/WAI/WCAG22/Understanding/contrast-enhanced.html)
3. [WCAG 2.2 non-text contrast, SC 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)
4. [WCAG 2.2 relative luminance definition](https://www.w3.org/TR/WCAG22/#dfn-relative-luminance)
