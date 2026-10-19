import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingState } from "@/components/shared/loading-state";
import { copy } from "@/features/universe/copy";
import { devRoutesEnabled } from "@/lib/dev-routes";
import { UniverseScreen } from "@/features/universe/universe-screen";

// /universe (SPEC §2.1, §2.5). Public. `?w=username` opens on that world.

export const metadata: Metadata = {
  title: "The universe · Worldling",
  description: "Every world, side by side. Find one you like and visit.",
  alternates: { canonical: "/universe" },
};

async function UniverseFromParams({ searchParams }: Pick<PageProps<"/universe">, "searchParams">) {
  const { w, perf } = await searchParams;
  const focus = typeof w === "string" && w.trim() !== "" ? w.trim().slice(0, 64) : null;
  // `?perf=1` runs the performance tour where dev routes are on (dev, or the Playwright build).
  const tour = devRoutesEnabled() && perf === "1";
  return <UniverseScreen focus={focus} perf={tour} />;
}

export default function UniversePage({ searchParams }: PageProps<"/universe">) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center px-4 py-16">
          <LoadingState label={copy.loading} />
        </div>
      }
    >
      <UniverseFromParams searchParams={searchParams} />
    </Suspense>
  );
}
