import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { MAIN_ID } from "@/components/shared/skip-link";
import { devRoutesEnabled } from "@/lib/dev-routes";

export default function DevLayout({ children }: { children: ReactNode }) {
  if (!devRoutesEnabled()) notFound();
  return (
    <main id={MAIN_ID} tabIndex={-1} className="flex flex-1 flex-col focus:outline-none">
      {children}
    </main>
  );
}
