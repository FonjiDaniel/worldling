import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DevPlanetPlayground } from "@/features/dev-planet/dev-planet-playground";
import { devRoutesEnabled } from "@/lib/dev-routes";

export const metadata: Metadata = {
  title: "Planet playground | Worldling",
  robots: { index: false, follow: false },
};

export default function DevPlanetPage() {
  if (!devRoutesEnabled()) notFound();
  return <DevPlanetPlayground />;
}
