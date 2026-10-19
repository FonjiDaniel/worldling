# OG image fonts

Static instances of the brand fonts for `ImageResponse` (satori), which can only render the default instance of a variable font (ADR-023). The web app itself uses `next/font` (`src/styles/fonts.ts`).

| File                         | Source (`docs/brand/04-typography/03-fonts/ttf/`) | Axes                        |
| ---------------------------- | ------------------------------------------------- | --------------------------- |
| `BricolageGrotesque-650.ttf` | `BricolageGrotesque-variable.ttf`                 | wght 650, wdth 100, opsz 48 |
| `Geist-400.ttf`              | `Geist-variable.ttf`                              | wght 400                    |
| `Geist-600.ttf`              | `Geist-variable.ttf`                              | wght 600                    |

These match the axes the 06 build script uses for the OG template. Both families are OFL (licenses beside them).

Rebuild with Python and `fonttools` 4.60.1:

```python
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

src = "docs/brand/04-typography/03-fonts/ttf/"
for name, out, axes in [
    ("BricolageGrotesque-variable.ttf", "BricolageGrotesque-650.ttf", {"wght": 650, "wdth": 100, "opsz": 48}),
    ("Geist-variable.ttf", "Geist-400.ttf", {"wght": 400}),
    ("Geist-variable.ttf", "Geist-600.ttf", {"wght": 600}),
]:
    instantiateVariableFont(TTFont(src + name), axes, inplace=False, updateFontNames=False).save(
        "src/assets/fonts/" + out
    )
```
