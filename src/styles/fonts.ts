import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";

// The single place typography is chosen. Swap families here; tokens.css reads the variables.
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display-face",
  display: "swap",
});

const sans = Geist({
  subsets: ["latin"],
  variable: "--font-sans-face",
  display: "swap",
});

const mono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono-face",
  display: "swap",
});

export const fontVariables = [display.variable, sans.variable, mono.variable].join(" ");
