# Worldling: Step 4 typography kit

Start with `01-guide/Worldling-Typography-Guide.pdf` or the complete Markdown reference beside it.

Included:
- Final font roles and reasons.
- A nine-level fluid type scale from 360px to 1440px viewports.
- Mobile and desktop sizes, unitless line heights, letter spacing and weights.
- Button, input, label, numeric and timestamp styles.
- English and French pairing examples.
- Font-face CSS, type classes and JSON specifications.
- Original variable TTF fonts, web WOFF2 files and license notices.
- A responsive local specimen with actual fonts, plus PNG previews.
- Verification results for fonts and type-scale endpoints, plus visually checked PDF specimens.

Open `04-previews/specimen.html` in a browser. Keep the folder structure intact for the relative CSS and font paths. The action buttons are visual type specimens only.

This package is Step 4 only. The Step 2 logo and Step 3 color system remain the approved sources for those parts of the brand.

Verification scope: font coverage, WOFF2 equivalence and CSS scale values were checked. PDF reference pages were visually reviewed. Test the HTML specimen and app at browser zoom and with user text-spacing overrides before launch.

Run the optional audit with Python plus `fonttools` and `brotli`: `python 05-source/audit_typography.py`.
