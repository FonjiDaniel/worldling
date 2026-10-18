import type { ComponentProps } from "react";

/**
 * A world on a tilted axis, for spin and tilt. Drawn to the 05 icon rules: 24 grid, 20 live
 * area, 1.75 stroke, round caps and joins, one color. Lucide has no axial-tilt symbol.
 */
export function TiltedWorldIcon(props: ComponentProps<"svg">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <circle cx="12" cy="12" r="6.5" />
      <path d="M8.4 4.2 7.7 2.6M15.6 19.8l.7 1.6" />
      <path d="M6.1 14.6c2.6 1.3 7.9-1 11.6-5.1" />
    </svg>
  );
}
