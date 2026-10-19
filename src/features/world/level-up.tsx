"use client";

import { Sparkles } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";

import { levelUpMessage } from "@convex/shared/bloomCopy";

import { Button } from "@/components/ui/button";

// The owner's level-up moment (ADR-023): shown once per device when the world has bloomed
// since the owner last looked. The processor also writes a level_up notification (Phase 9 list).

const KEY = "worldling:bloomSeen:v1";

function readSeen(worldId: string): number | null {
  try {
    const seen: unknown = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    if (typeof seen !== "object" || seen === null) return null;
    const level: unknown = Reflect.get(seen, worldId);
    return typeof level === "number" ? level : null;
  } catch {
    return null;
  }
}

function writeSeen(worldId: string, level: number): void {
  try {
    const seen: unknown = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    const next = typeof seen === "object" && seen !== null ? { ...seen } : {};
    localStorage.setItem(KEY, JSON.stringify({ ...next, [worldId]: level }));
  } catch {
    // Without storage the moment simply doesn't show.
  }
}

const noSubscribe = () => () => undefined;

/** The level to celebrate, or null, and a way to dismiss it. */
export function useLevelUp(worldId: string, level: number, enabled: boolean) {
  const stored = useSyncExternalStore(
    noSubscribe,
    () => (enabled ? readSeen(worldId) : null),
    () => null,
  );
  const [seen, setSeen] = useState<number | null>(null);
  const lastSeen = seen ?? stored;
  useEffect(() => {
    // The first visit on this device sets the baseline instead of celebrating old growth.
    if (enabled && stored === null) writeSeen(worldId, level);
  }, [enabled, stored, worldId, level]);
  const celebrate = enabled && lastSeen !== null && level > lastSeen ? level : null;
  const dismiss = () => {
    writeSeen(worldId, level);
    setSeen(level);
  };
  return { celebrate, dismiss };
}

export function LevelUpCard({ level, onDone }: { level: number; onDone: () => void }) {
  return (
    <div className="flex animate-panel-in flex-col gap-3 glass-panel">
      <p className="flex items-center gap-2 wl-label text-accent">
        <Sparkles aria-hidden className="size-5" />
        Bloom level {level}
      </p>
      <p role="status" className="wl-h4 text-text">
        {levelUpMessage(level)}
      </p>
      <Button variant="secondary" size="sm" className="self-start" onClick={onDone}>
        Close
      </Button>
    </div>
  );
}
