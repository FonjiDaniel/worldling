import type { WorldParams } from "@convex/shared/worldParams";

import { effectiveTier, useExperience } from "@/stores/experience";

import { isRenderTier } from "./quality";

// Thumbnail requests (SPEC §8.7). Pages ask; ThumbnailStudio, inside the one canvas, renders
// them one at a time. Without a live canvas (tier 0, a lost context) the answer is null.

export interface ThumbnailJob {
  id: number;
  params: WorldParams;
  level: number;
  resolve: (blob: Blob | null) => void;
}

/** Long enough for the 3D chunk to load on a slow phone, short enough to never hang a save. */
const JOB_TIMEOUT_MS = 15_000;

const queue: ThumbnailJob[] = [];
const listeners = new Set<() => void>();
let nextId = 1;

function notify(): void {
  for (const listener of listeners) listener();
}

export function subscribeThumbnails(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The job being rendered, as a stable snapshot for useSyncExternalStore. */
export function currentThumbnailJob(): ThumbnailJob | null {
  return queue[0] ?? null;
}

function canRender(): boolean {
  const state = useExperience.getState();
  return state.webgl === "ok" && !state.shaderFailed && isRenderTier(effectiveTier(state));
}

/** A square WebP of the world (THUMBNAIL_SIZE), or null when this device can't draw one. */
export function requestThumbnail(params: WorldParams, level: number): Promise<Blob | null> {
  if (!canRender()) return Promise.resolve(null);
  return new Promise((resolve) => {
    const job: ThumbnailJob = { id: nextId++, params, level, resolve: () => undefined };
    const timer = setTimeout(() => {
      finishThumbnail(job, null);
    }, JOB_TIMEOUT_MS);
    job.resolve = (blob) => {
      clearTimeout(timer);
      resolve(blob);
    };
    queue.push(job);
    notify();
  });
}

/** Settles a job and moves on to the next one. Safe to call twice. */
export function finishThumbnail(job: ThumbnailJob, blob: Blob | null): void {
  const index = queue.indexOf(job);
  if (index === -1) return;
  queue.splice(index, 1);
  job.resolve(blob);
  notify();
}
