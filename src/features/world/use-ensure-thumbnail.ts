"use client";

import { useEffect, useRef } from "react";

import { useThumbnailUpload } from "@/features/creator/use-thumbnail-upload";
import { useEffectiveTier } from "@/stores/experience";
import { isRenderTier } from "@/three/quality";
import type { Id } from "@convex/_generated/dataModel";
import type { WorldParams } from "@convex/shared/worldParams";

/** Tries before giving up until the next save; a busy device can miss the first one. */
const THUMBNAIL_TRIES = 3;
const THUMBNAIL_RETRY_SECONDS = 5;

interface ThumbnailWorld {
  _id: Id<"worlds">;
  params: WorldParams;
  level: number;
  thumbnailUrl: string | null;
}

/** Owners without a thumbnail (a freshly claimed world) make one here (SPEC §8.7). */
export function useEnsureThumbnail(world: ThumbnailWorld, isOwner: boolean): void {
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
      await new Promise((resolve) => setTimeout(resolve, THUMBNAIL_RETRY_SECONDS * 1000));
      if (isMounted()) await attempt(left - 1);
    };
    void attempt(THUMBNAIL_TRIES);
  }, [needed, upload, world]);
}
