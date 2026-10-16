import Link from "next/link";
import type { ReactNode } from "react";

import { Logo } from "@/components/shared/logo";
import { MAIN_ID } from "@/components/shared/skip-link";

// UX shell only. Access is enforced in Convex staff/admin wrappers (ADR-010).
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <aside className="flex shrink-0 flex-col gap-6 border-b border-line bg-surface p-4 md:w-64 md:border-r md:border-b-0">
        <Link href="/" className="rounded-sm" aria-label="Worldling home">
          <Logo className="h-7" />
        </Link>
        <nav aria-label="Admin">
          <p className="text-xs font-medium tracking-wide text-text-muted uppercase">Admin</p>
        </nav>
      </aside>
      <main
        id={MAIN_ID}
        tabIndex={-1}
        className="flex flex-1 flex-col p-4 focus:outline-none sm:p-8"
      >
        {children}
      </main>
    </div>
  );
}
