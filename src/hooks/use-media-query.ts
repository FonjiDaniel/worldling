"use client";

import { useSyncExternalStore } from "react";

type Breakpoint = "sm" | "md" | "lg" | "xl";

/** A breakpoint's width as tokens.css defines it (SPEC §3.6), so no sizes live in components. */
function breakpointQuery(breakpoint: Breakpoint): string {
  const width = getComputedStyle(document.documentElement)
    .getPropertyValue(`--breakpoint-${breakpoint}`)
    .trim();
  return `(min-width: ${width})`;
}

/** True from `breakpoint` up. False on the server and before hydration. */
export function useBreakpoint(breakpoint: Breakpoint): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(breakpointQuery(breakpoint));
      query.addEventListener("change", onChange);
      return () => {
        query.removeEventListener("change", onChange);
      };
    },
    () => window.matchMedia(breakpointQuery(breakpoint)).matches,
    () => false,
  );
}

const noSubscribe = () => () => undefined;

/** False during server rendering and hydration, true after. For browser-only state. */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );
}
