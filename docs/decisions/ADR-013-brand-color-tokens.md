# ADR-013: Brand color tokens replace the §3.2 values

- **Status:** Accepted
- **Date:** 2026-10-16
- **Spec:** §3.1, §3.2, §3.7

## Context

§3.2 shipped placeholder colors and said final values come from the brand kit. The brand color kit is now in `docs/brand/Worldling-brand-colors/` (source of truth: `02-color-files/worldling-colors.css`, rules and contrast audit in `01-guide/Worldling-Color-System.md`). It keeps the eight anchors but changes the status colors, makes the separator line opaque, and adds colors §3.2 has no name for: a link color, a control boundary, an info status, opaque status surfaces and three 50 to 950 accent scales.

The audit also shows Starlight text fails AA on the Nebula, Aurora and Sunrise fills, so filled controls need a dark "on" color.

## Decision

- The brand HEX values fill the §3.2 token names unchanged: `void`, `surface`, `surface-raised`, `text`, `text-muted`, `primary`, `accent`, `warm`, `success`, `warning`, `danger`.
- `--color-line` becomes the opaque brand Line (`#34365A`) and is decorative only. A new `--color-control-line` (`#696C91`) marks required control boundaries (3:1 non-text contrast on every surface).
- `--color-glass` keeps its role: Deep Space at 62% opacity. Text on glass still needs a scrim per §3.1.
- New tokens: `--color-link` (Nebula 300), `--color-info`, `--color-{success,warning,danger,info}-surface`, `--color-on-{primary,accent,warm,danger}` (all Void), `--color-warm-hover` (Sunrise 400), `--color-warm-active` (Sunrise 600), `--color-{nebula,aurora,sunrise}-{50..950}` and `--gradient-brand`.
- The focus ring is Aurora with a 2px offset, so a dark gap separates it from bright fills.
- Dark only for now. The light theme in §3.1 is deferred: the brand kit's light treatment is "not a complete light-mode UI system". Tokens are semantic, so a light theme can later override values under `[data-theme="light"]` without touching components.

## Alternatives considered

- **Keep §3.2 values and add brand values beside them:** two competing palettes, and components would drift.
- **Keep `line` as translucent white:** the brand kit specifies an opaque line, and translucent borders change contrast over the 3D scene.

## Consequences

- Components may only use semantic names or the scale steps. The scales exist for art and charts, not for text on arbitrary surfaces: a scale step alone does not guarantee contrast.
- Any new text or fill pair needs a contrast check against the audit before use.
- Follow-up: a light theme ADR when static pages or admin need it.
