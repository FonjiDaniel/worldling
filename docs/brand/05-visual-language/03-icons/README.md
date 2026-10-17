# Worldling icons

Use the 24px masters at 20, 24 or 32px. Use the separate 16px optical versions at 16px. All SVGs use currentColor. Inline the SVG or use the sprite in a colored SVG element. Files loaded through img do not inherit their parent's text color.

Example using the external sprite:

```html
<button aria-label="Visit world" class="wl-icon-button wl-focus">
  <svg width="24" height="24" aria-hidden="true" style="color:#F4F1EA">
    <use href="worldling-icons.svg#worldling-visit"></use>
  </svg>
</button>
```

Keep decorative icons hidden from assistive technology when the button already has a visible label. Translate accessible names together with visible labels. The PNG copies use Starlight on transparent backgrounds. The symbol file is intended to be referenced, not displayed on its own.
