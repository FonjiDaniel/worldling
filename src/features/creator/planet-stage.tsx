"use client";

import { useId } from "react";

import { cn } from "@/lib/utils";
import { PlanetView } from "@/three/planet/PlanetView";
import { useDragTurn } from "@/three/planet/use-drag-turn";

import { useCreator, useShownParams } from "./store";

/** The live preview: drag (or arrow keys) to turn it. New worlds are bloom level 1. */
export function PlanetStage({ className, caption }: { className?: string; caption?: boolean }) {
  const params = useShownParams();
  const handle = useCreator((state) => state.handle);
  const turn = useDragTurn(handle);
  const captionId = useId();

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div
        role="group"
        aria-label="Your world"
        aria-describedby={captionId}
        tabIndex={0}
        className="relative min-h-0 w-full flex-1 cursor-grab touch-pan-y rounded-lg active:cursor-grabbing"
        {...turn}
      >
        <PlanetView params={params} level={1} handle={handle} className="size-full" />
      </div>
      <p id={captionId} className={cn("wl-small text-text-muted", caption === false && "sr-only")}>
        Drag to turn your world
        <span className="sr-only">, or use the left and right arrow keys</span>
      </p>
    </div>
  );
}
