import Link from "next/link";
import type { ReactNode } from "react";

import { Logo } from "@/components/shared/logo";
import { MAIN_ID } from "@/components/shared/skip-link";

// Small screens follow the 06 mobile mockup: lockup top left, content full bleed on the space
// backdrop. From sm up the form sits in one centered glass panel.
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main
      id={MAIN_ID}
      tabIndex={-1}
      className="flex flex-1 flex-col gap-8 px-panel-pad py-6 focus:outline-none sm:items-center sm:justify-center sm:gap-6 sm:px-4 sm:py-12"
    >
      <Link href="/" className="self-start rounded-sm sm:self-center" aria-label="Worldling home">
        <Logo priority />
      </Link>
      <div className="w-full animate-panel-in sm:max-w-panel sm:glass-panel">{children}</div>
    </main>
  );
}
