"use client";

import { useConvexAuth, useMutation } from "convex/react";
import { useEffect } from "react";

import { toAppError } from "@/lib/errors";
import { reportError } from "@/lib/logger";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

// Tend and visit (SPEC §2.2). The owner tends on open; anyone else signed in counts as a visit
// after 3 seconds of the tab being visible, which filters drive-by loads and bots. The server
// decides what counts, so failures stay quiet.

export const VISIT_DWELL_SECONDS = 3;

const EXPECTED = new Set([
  "UNAUTHENTICATED",
  "PRECONDITION",
  "SUSPENDED",
  "RATE_LIMITED",
  "MAINTENANCE",
]);

function quietly(fn: string) {
  return (error: unknown) => {
    if (!EXPECTED.has(toAppError(error).code)) reportError(error, { fn });
  };
}

/** Calls `onDwell` once the tab has been visible for the dwell time in one stretch. */
function watchDwell(onDwell: () => void): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const update = () => {
    clearTimeout(timer);
    timer = undefined;
    if (document.visibilityState !== "visible") return;
    timer = setTimeout(() => {
      document.removeEventListener("visibilitychange", update);
      onDwell();
    }, VISIT_DWELL_SECONDS * 1000);
  };
  document.addEventListener("visibilitychange", update);
  update();
  return () => {
    clearTimeout(timer);
    document.removeEventListener("visibilitychange", update);
  };
}

export function useVisitTracking(worldId: Id<"worlds">, isOwner: boolean): void {
  const { isAuthenticated } = useConvexAuth();
  const tend = useMutation(api.worlds.tend);
  const recordVisit = useMutation(api.worlds.recordVisit);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (isOwner) {
      tend({ worldId }).catch(quietly("worlds:tend"));
      return;
    }
    return watchDwell(() => {
      recordVisit({ worldId }).catch(quietly("worlds:recordVisit"));
    });
  }, [isAuthenticated, isOwner, worldId, tend, recordVisit]);
}
