"use client";

import { useState, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";

// The world_created celebration (SPEC §2.2, 07 celebrations.world_created): shown once, on
// the world page, right after a world is claimed. A one-shot flag per tab carries it over.

const KEY = "worldling:celebrate:v1";

export function markCelebration(username: string): void {
  try {
    sessionStorage.setItem(KEY, username);
  } catch {
    // Without storage the world page simply skips the celebration.
  }
}

/** True once for `username`; the flag is used up by reading it. */
export function takeCelebration(username: string): boolean {
  try {
    const flagged = sessionStorage.getItem(KEY) === username;
    if (flagged) sessionStorage.removeItem(KEY);
    return flagged;
  } catch {
    return false;
  }
}

function peekCelebration(username: string): boolean {
  try {
    return sessionStorage.getItem(KEY) === username;
  } catch {
    return false;
  }
}

const noSubscribe = () => () => undefined;

/**
 * Whether to celebrate on this page, and a way to finish. Storage is read after hydration only
 * (the page is server rendered), and the flag is used up when the celebration ends.
 */
export function useCelebration(username: string): [boolean, () => void] {
  const flagged = useSyncExternalStore(
    noSubscribe,
    () => peekCelebration(username),
    () => false,
  );
  const [done, setDone] = useState(false);
  const finish = () => {
    takeCelebration(username);
    setDone(true);
  };
  return [flagged && !done, finish];
}

export function CelebrationCard({ onDone }: { onDone: () => void }) {
  return (
    <div className="flex animate-panel-in flex-col gap-4 glass-panel">
      <p role="status" className="wl-h4 text-text">
        Your world is here. Make yourself at home.
      </p>
      <Button autoFocus className="self-start" onClick={onDone}>
        View my world
      </Button>
    </div>
  );
}
