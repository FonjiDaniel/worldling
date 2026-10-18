import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Teach tailwind-merge the brand scales (tokens.css) so `text-body-lg` is a size, not a color,
// and `shadow-panel` replaces `shadow-dialog` instead of both staying.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        "display",
        "h1",
        "h2",
        "h3",
        "h4",
        "body-lg",
        "body",
        "small",
        "caption",
        "button",
        "label",
        "input",
        "data",
        "timestamp",
      ],
      shadow: ["panel", "dialog", "selection"],
      spacing: ["touch", "control", "panel-pad", "panel-pad-lg"],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
