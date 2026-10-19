import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { preloadQuery } from "convex/nextjs";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { describeWorld } from "@convex/shared/worldParams";

import { LoadingState } from "@/components/shared/loading-state";
import { WorldScreen } from "@/features/world/world-screen";
import { loadPublicWorld } from "@/features/world/server";
import { api } from "@convex/_generated/api";

// /w/[username] (SPEC §2.2, §12). Metadata and the OG image come from the public view; the page
// preloads with the viewer's token, so the owner's controls are there on first paint.

export async function generateMetadata({ params }: PageProps<"/w/[username]">): Promise<Metadata> {
  const username = decodeURIComponent((await params).username);
  const data = await loadPublicWorld(username).catch(() => null);
  if (data === null) {
    return { title: "World not found · Worldling", robots: { index: false } };
  }
  const { world, owner } = data;
  const title = `${world.name} by @${owner.username} · Worldling`;
  const description = describeWorld(world.params, world.level);
  const url = `/w/${owner.username}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website", siteName: "Worldling" },
    twitter: { card: "summary_large_image", title, description },
  };
}

/**
 * Reads the URL and the auth cookie inside Suspense, so the page shell stays instant. The world
 * renders per request (Convex's client ids use Math.random), which connection() declares.
 */
async function WorldFromParams({ params }: Pick<PageProps<"/w/[username]">, "params">) {
  await connection();
  const username = decodeURIComponent((await params).username);
  const preloaded = await preloadQuery(
    api.worlds.getByUsername,
    { username },
    { token: await convexAuthNextjsToken() },
  );
  return <WorldScreen preloaded={preloaded} />;
}

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
