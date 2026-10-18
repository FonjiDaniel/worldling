"use client";

import { useMutation } from "convex/react";
import { useRef } from "react";

import type { WorldParams } from "@convex/shared/worldParams";

import { toAppError } from "@/lib/errors";
import { reportError } from "@/lib/logger";
import { requestThumbnail } from "@/three/thumbnails";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

// Thumbnail capture and upload (SPEC §8.7): render, POST to storage, then setThumbnail checks
// the file. It never blocks or interrupts: a failure is reported and the next save tries again.

export function useThumbnailUpload() {
  const uploadUrl = useMutation(api.worlds.generateThumbnailUploadUrl);
  const setThumbnail = useMutation(api.worlds.setThumbnail);
  const running = useRef<Promise<boolean> | null>(null);

  const upload = async (worldId: Id<"worlds">, params: WorldParams, level: number) => {
    const blob = await requestThumbnail(params, level);
    if (blob === null) return false;
    const url = await uploadUrl({ worldId });
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": blob.type },
      body: blob,
    });
    if (!response.ok) throw new Error(`Thumbnail upload failed: ${String(response.status)}`);
    const { storageId } = (await response.json()) as { storageId: Id<"_storage"> };
    const result = await setThumbnail({ worldId, storageId });
    if (!result.ok) throw new Error(`Thumbnail rejected: ${result.reason}`);
    return true;
  };

  /**
   * Captures and uploads, one at a time. Resolves true once the thumbnail is stored, false when
   * it couldn't be made this time. Never rejects.
   */
  return (worldId: Id<"worlds">, params: WorldParams, level: number): Promise<boolean> => {
    const previous = running.current ?? Promise.resolve(true);
    const next = previous
      .then(() => upload(worldId, params, level))
      .catch((error: unknown) => {
        // Expected refusals (too many saves, maintenance) just wait for the next save.
        const { code } = toAppError(error);
        if (code !== "RATE_LIMITED" && code !== "MAINTENANCE") {
          reportError(error, { fn: "worlds:thumbnail" });
        }
        return false;
      });
    running.current = next;
    return next;
  };
}
