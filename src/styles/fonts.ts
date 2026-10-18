import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";

// The single place typography is loaded (04 typography, ADR-018). Variable fonts with every
// weight; Bricolage keeps its optical size and width axes. tokens.css reads the variables.
const display = Bricolage_Grotesque({
  subsets: ["latin", "latin-ext"],
  axes: ["opsz", "wdth"],
  variable: "--font-display-face",
  display: "swap",
  adjustFontFallback: true,
});

const sans = Geist({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans-face",
  display: "swap",
  adjustFontFallback: true,
});

const mono = Geist_Mono({
  subsets: ["latin", "latin-ext"],
  variable: "--font-mono-face",
  display: "swap",
  adjustFontFallback: true,
});

export const fontVariables = [display.variable, sans.variable, mono.variable].join(" ");
