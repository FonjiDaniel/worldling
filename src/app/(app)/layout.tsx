import Link from "next/link";
import type { ReactNode } from "react";

import { Logo } from "@/components/shared/logo";
import { MAIN_ID } from "@/components/shared/skip-link";
import { AccountMenu } from "@/features/auth/account-menu";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-glass backdrop-blur-glass">
        <div className="mx-auto flex h-16 w-full max-w-page items-center justify-between px-4 sm:px-6">
          <Link href="/" className="rounded-sm" aria-label="Worldling home">
            <Logo className="h-7" />
          </Link>
          <AccountMenu />
        </div>
      </header>
      <main id={MAIN_ID} tabIndex={-1} className="flex flex-1 flex-col focus:outline-none">
        {children}
      </main>
    </>
  );
}
