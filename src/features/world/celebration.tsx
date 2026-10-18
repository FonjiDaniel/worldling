"use client";

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
