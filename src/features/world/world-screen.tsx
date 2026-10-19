"use client";

import { type Preloaded, usePaginatedQuery, usePreloadedQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import Link from "next/link";
import { useMemo } from "react";

import { UniverseIcon } from "@/components/icons/universe";
import { EmptyState } from "@/components/shared/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { useIsClient } from "@/hooks/use-media-query";
import { env } from "@/lib/env";
import { cn } from "@/lib/utils";
import { PlanetView } from "@/three/planet/PlanetView";
import { api } from "@convex/_generated/api";

import { BloomCard } from "./bloom-card";
import { CelebrationCard, useCelebration } from "./celebration";
import { COMET_PAGE, CometList } from "./comet-list";
import { LevelUpCard, useLevelUp } from "./level-up";
import { OwnerControls } from "./owner-controls";
import { sharePayload } from "./share";
import { ShareControl } from "./share-control";
import { useEnsureThumbnail } from "./use-ensure-thumbnail";
import { useVisitTracking } from "./use-visit-tracking";

// /w/[username] (SPEC §2.2): the 06 mobile world page, the world on top and its story below.
// From lg the world takes the stage and the story sits in a side column.

type WorldPage = NonNullable<FunctionReturnType<typeof api.worlds.getByUsername>>;

export function WorldScreen({
  preloaded,
}: {
  preloaded: Preloaded<typeof api.worlds.getByUsername>;
}) {
  const data = usePreloadedQuery(preloaded);
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

function OwnerLine({ displayName, username }: WorldPage["owner"]) {
  return (
    <div className="flex items-center gap-3">
      <Avatar name={displayName} />
      <p className="flex flex-col">
        <span className="wl-label text-text">{displayName}</span>
        <span className="wl-small text-text-muted">@{username}</span>
      </p>
    </div>
  );
}

interface MomentsProps {
  data: WorldPage;
  celebrating: boolean;
  onCelebrated: () => void;
}

/** The claim celebration first; after that, a level-up when the world has bloomed. */
function Moments({ data, celebrating, onCelebrated }: MomentsProps) {
  const { world, isOwner } = data;
  const levelUp = useLevelUp(world._id, world.level, isOwner && !celebrating);
  if (celebrating) return <CelebrationCard onDone={onCelebrated} />;
  if (levelUp.celebrate !== null) {
    return <LevelUpCard level={levelUp.celebrate} onDone={levelUp.dismiss} />;
  }
  return null;
}

function WorldView({ data }: { data: WorldPage }) {
  const { world, owner, isOwner, cometReview } = data;
  const [celebrating, finishCelebration] = useCelebration(owner.username);
  // The 3D view depends on this device's quality tier, so it starts after hydration.
  const isClient = useIsClient();
  useEnsureThumbnail(world, isOwner);
  useVisitTracking(world._id, isOwner);
  const comets = usePaginatedQuery(
    api.comets.listForWorld,
    { worldId: world._id },
    { initialNumItems: COMET_PAGE },
  );
  const idsKey = comets.results.map((comet) => comet._id).join(",");
  const cometIds = useMemo(() => (idsKey === "" ? [] : idsKey.split(",")), [idsKey]);
  const payload = sharePayload({
    siteUrl: env.NEXT_PUBLIC_SITE_URL,
    username: owner.username,
    worldName: world.name,
    isOwner,
  });
  const shareLabel = isOwner ? "Share my world" : "Share this world";
  const share = (look: "icon" | "primary", className?: string) => (
    <ShareControl payload={payload} look={look} label={shareLabel} className={className} />
  );

  return (
    <div className="flex flex-1 flex-col lg:h-[calc(100dvh-(--spacing(18)))] lg:flex-row">
      <div className="relative h-[55dvh] shrink-0 lg:h-auto lg:min-w-0 lg:flex-1">
        {isClient ? (
          <PlanetView
            params={world.params}
            level={world.level}
            comets={cometIds}
            className={cn("size-full", celebrating && "animate-bloom-in")}
          />
        ) : null}
        {share("icon", "absolute top-3 right-3 lg:hidden")}
      </div>
      <aside className="flex flex-col gap-6 px-4 pb-10 sm:px-6 lg:w-panel lg:shrink-0 lg:overflow-y-auto lg:border-l lg:border-line lg:glass lg:py-8">
        <header className="flex items-start justify-between gap-4">
          <h1 className="wl-h1 break-words text-text lg:wl-h2">{world.name}</h1>
          {share("icon", "hidden lg:inline-flex")}
        </header>
        <OwnerLine {...owner} />
        <Moments data={data} celebrating={celebrating} onCelebrated={finishCelebration} />
        <BloomCard xp={world.xp} />
        {share("primary", "w-full")}
        <Link
          href={`/universe?w=${owner.username}`}
          className="flex min-h-touch items-center justify-center gap-2 self-center rounded-full px-3 wl-label text-link hover:underline"
        >
          <UniverseIcon className="size-5" />
          Explore the universe
        </Link>
        {isOwner && cometReview !== null ? (
          <OwnerControls worldId={world._id} username={owner.username} cometReview={cometReview} />
        ) : null}
        <CometList
          worldId={world._id}
          comets={comets}
          isOwner={isOwner}
          shareAction={share("primary")}
        />
      </aside>
    </div>
  );
}
