import Link from "next/link";
import type { ReactNode } from "react";

import { Logo } from "@/components/shared/logo";
import { MAIN_ID } from "@/components/shared/skip-link";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="mx-auto flex w-full max-w-page items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="rounded-sm" aria-label="Worldling home">
          <Logo priority />
        </Link>
      </header>
      <main id={MAIN_ID} tabIndex={-1} className="flex flex-1 flex-col focus:outline-none">
        {children}
      </main>
      <footer className="mx-auto w-full max-w-page border-t border-line px-4 py-6 sm:px-6">
        <p className="wl-label text-text">Grow a world of your own.</p>
        <p className="wl-small text-text-muted">Visit everyone else&apos;s.</p>
      </footer>
    </>
  );
}
