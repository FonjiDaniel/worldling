"use client";

import { Dices, Redo2, Undo2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/utils";

import { useCreator } from "./store";
import type { CreatorActions } from "./use-creator-actions";

const isMac = () => typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.userAgent);

/** Randomize, undo and redo, next to the world they change. */
export function CreatorToolbar({
  actions,
  className,
}: {
  actions: CreatorActions;
  className?: string;
}) {
  const canUndo = useCreator((state) => state.history.past.length > 0);
  const canRedo = useCreator((state) => state.history.future.length > 0);
  const mod = isMac() ? "Cmd" : "Ctrl";

  return (
    <div
      role="toolbar"
      aria-label="World tools"
      className={cn("flex items-center gap-2", className)}
    >
      <Button variant="secondary" onClick={actions.randomize}>
        <Dices aria-hidden />
        Randomize
      </Button>
      <IconButton
        variant="secondary"
        label="Undo"
        icon={<Undo2 />}
        aria-keyshortcuts="Control+Z Meta+Z"
        title={`Undo (${mod}+Z)`}
        disabled={!canUndo}
        onClick={actions.undo}
      />
      <IconButton
        variant="secondary"
        label="Redo"
        icon={<Redo2 />}
        aria-keyshortcuts="Control+Shift+Z Meta+Shift+Z Control+Y"
        title={`Redo (${mod}+Shift+Z)`}
        disabled={!canRedo}
        onClick={actions.redo}
      />
    </div>
  );
}
