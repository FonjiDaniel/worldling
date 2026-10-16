import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DevUiShowcase } from "@/features/dev-ui/dev-ui-showcase";
import { devRoutesEnabled } from "@/lib/dev-routes";

export const metadata: Metadata = {
  title: "UI kit | Worldling",
  robots: { index: false, follow: false },
};

export default function DevUiPage() {
  if (!devRoutesEnabled()) notFound();
  return <DevUiShowcase />;
}
