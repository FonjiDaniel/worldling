import type { ComponentProps } from "react";

/** The brand universe icon (05 icons, universe.svg): orbit arcs around a world. */
export function UniverseIcon(props: ComponentProps<"svg">) {
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
      <path d="M7 5.9C11.1 3.5 17.7 3.8 20 7M20.8 11.8c-.8 3.7-5.1 6.9-9.7 7.8M6.5 19.3C1 18.2 1.6 12.4 4.1 9.5" />
      <circle cx="12" cy="12" r="2.7" />
      <circle cx="4.8" cy="7.4" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="20.7" cy="9.2" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="8.7" cy="19.8" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}
