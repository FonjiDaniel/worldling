import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingState } from "@/components/shared/loading-state";
import { WorldScreen } from "@/features/world/world-screen";

export async function generateMetadata({ params }: PageProps<"/w/[username]">): Promise<Metadata> {
  const { username } = await params;
  return { title: `@${username}'s world · Worldling` };
}

/** Reads the URL inside Suspense, so the page shell stays instant (Cache Components). */
async function WorldFromParams({ params }: Pick<PageProps<"/w/[username]">, "params">) {
  const { username } = await params;
  return <WorldScreen username={decodeURIComponent(username)} />;
}

// Phase 7 adds server metadata from the world itself, preloadQuery and the OG image (§12).
export default function WorldPage({ params }: PageProps<"/w/[username]">) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center px-4 py-16">
          <LoadingState label="Finding this world" />
        </div>
      }
    >
      <WorldFromParams params={params} />
    </Suspense>
  );
}
