"use client";

import { useQuery } from "convex/react";
import { PenLine } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { Button } from "@/components/ui/button";
import { useThumbnailUpload } from "@/features/creator/use-thumbnail-upload";
import { cn } from "@/lib/utils";
import { useEffectiveTier } from "@/stores/experience";
import { PlanetView } from "@/three/planet/PlanetView";
import { isRenderTier } from "@/three/quality";
import { api } from "@convex/_generated/api";
import type { FunctionReturnType } from "convex/server";

import { CelebrationCard, takeCelebration } from "./celebration";

// /w/[username], the minimal Phase 6 version (ADR-021): the world, its name, its owner, and
// the claim celebration. Phase 7 adds bloom, visits, comets and sharing.

type WorldPage = NonNullable<FunctionReturnType<typeof api.worlds.getByUsername>>;

export function WorldScreen({ username }: { username: string }) {
  const data = useQuery(api.worlds.getByUsername, { username });
  if (data === undefined) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-16">
        <LoadingState label="Finding this world" />
      </div>
    );
  }
  if (data === null) {
    return (
      <div className="mx-auto flex w-full max-w-panel flex-1 flex-col justify-center px-4 py-16">
        <EmptyState
          title="This world isn't available."
          description="It may have moved, or its owner took it out of view."
        />
      </div>
    );
  }
  return <WorldView data={data} />;
}

/** Tries before giving up until the next save; a busy device can miss the first one. */
const THUMBNAIL_TRIES = 3;
const THUMBNAIL_RETRY_MS = 5_000;

/** Owners without a thumbnail (a freshly claimed world) make one here (SPEC §8.7). */
function useEnsureThumbnail({ world, isOwner }: WorldPage) {
  const upload = useThumbnailUpload();
  const tier = useEffectiveTier();
  const started = useRef(false);
  const mounted = useRef(true);
  const needed = isOwner && world.thumbnailUrl === null && isRenderTier(tier);
  useEffect(
    () => () => {
      mounted.current = false;
    },
    [],
  );
  useEffect(() => {
    if (!needed || started.current) return;
    started.current = true;
    const isMounted = () => mounted.current;
    const attempt = async (left: number): Promise<void> => {
      const done = await upload(world._id, world.params, world.level);
      if (done || left <= 1 || !isMounted()) return;
      await new Promise((resolve) => setTimeout(resolve, THUMBNAIL_RETRY_MS));
      if (isMounted()) await attempt(left - 1);
    };
    void attempt(THUMBNAIL_TRIES);
  }, [needed, upload, world]);
}

function WorldView({ data }: { data: WorldPage }) {
  const { world, owner, isOwner } = data;
  const [celebrating, setCelebrating] = useState(() => takeCelebration(owner.username));
  useEnsureThumbnail(data);

  return (
    <div className="relative flex h-[calc(100dvh-(--spacing(18)))] flex-col">
      <PlanetView
        params={world.params}
        level={world.level}
        className={cn("min-h-0 flex-1", celebrating && "animate-bloom-in")}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-4 p-4 sm:p-6 lg:flex-row lg:items-end lg:justify-between">
        <section
          aria-labelledby="world-name"
          className="pointer-events-auto flex max-w-panel flex-col gap-1 glass-panel"
        >
          <h1 id="world-name" className="wl-h2 text-text">
            {world.name}
          </h1>
          <p className="wl-body text-text-muted">
            {owner.displayName} <span className="wl-timestamp">@{owner.username}</span>
          </p>
          {isOwner ? (
            <Button asChild variant="secondary" size="sm" className="mt-3 self-start">
              <Link href="/create">
                <PenLine aria-hidden />
                Edit my world
              </Link>
            </Button>
          ) : null}
        </section>
        {celebrating ? (
          <div className="pointer-events-auto max-w-panel">
            <CelebrationCard
              onDone={() => {
                setCelebrating(false);
              }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
