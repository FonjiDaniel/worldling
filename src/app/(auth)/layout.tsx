import Link from "next/link";
import type { ReactNode } from "react";

import { Logo } from "@/components/shared/logo";
import { MAIN_ID } from "@/components/shared/skip-link";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main
      id={MAIN_ID}
      tabIndex={-1}
      className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-12 focus:outline-none"
    >
      <Link href="/" className="rounded-full" aria-label="Worldling home">
        <Logo variant="mark" priority />
      </Link>
      <div className="w-full max-w-panel rounded-lg border border-line bg-glass p-6 shadow-raised backdrop-blur-glass sm:p-8">
        {children}
      </div>
    </main>
  );
}
