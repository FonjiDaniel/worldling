import Link from "next/link";
import type { ReactNode } from "react";

import { UniverseIcon } from "@/components/icons/universe";
import { Logo } from "@/components/shared/logo";
import { MAIN_ID } from "@/components/shared/skip-link";
import { AccountMenu } from "@/features/auth/account-menu";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line glass">
        <div className="mx-auto flex min-h-18 w-full max-w-page items-center justify-between px-4 sm:px-6">
          <Link href="/" className="rounded-sm" aria-label="Worldling home">
            <Logo />
          </Link>
          <nav aria-label="Main" className="flex items-center gap-2">
            <Link
              href="/universe"
              className="flex min-h-touch items-center gap-2 rounded-full px-3 wl-label text-text-muted transition-colors duration-fast ease-out hover:text-text"
            >
              <UniverseIcon className="size-5" />
              Explore
            </Link>
            <AccountMenu />
          </nav>
        </div>
      </header>
      <main id={MAIN_ID} tabIndex={-1} className="flex flex-1 flex-col focus:outline-none">
        {children}
      </main>
    </>
  );
}
