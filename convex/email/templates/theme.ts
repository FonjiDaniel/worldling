// Brand values for email (SPEC §7.7). Email clients can't read CSS variables, so the values are
// literal here and a test keeps them equal to src/styles/tokens.css. Keys are the token names.

export const emailColors = {
  void: "#07071a",
  surface: "#11122b",
  "surface-raised": "#1a1b3a",
  line: "#34365a",
  text: "#f4f1ea",
  "text-muted": "#9a9bb8",
  link: "#a99fff",
  primary: "#7c6cff",
  "on-primary": "#07071a",
  accent: "#3fe0c5",
} as const;

export const emailFont =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export const emailMonoFont = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

// Pixel sizes, because rem and clamp() are unreliable in Outlook and Gmail.
export const emailSize = {
  width: 560,
  gutter: 24,
  radius: 14,
  text: 16,
  small: 13,
  heading: 24,
  code: 32,
} as const;
