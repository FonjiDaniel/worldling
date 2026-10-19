"use client";

import { PenLine } from "lucide-react";
import Link from "next/link";
import { useId } from "react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAppMutation } from "@/hooks/use-app-mutation";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

// The owner's tools on their world page: edit, and comet review (SPEC §2.6).

interface OwnerControlsProps {
  worldId: Id<"worlds">;
  username: string;
  cometReview: boolean;
}

export function OwnerControls({ worldId, username, cometReview }: OwnerControlsProps) {
  const online = useOnlineStatus();
  const switchId = useId();
  const hintId = useId();
  const setReview = useAppMutation(api.worlds.setCometReview, {
    optimisticUpdate: (store, { enabled }) => {
      const current = store.getQuery(api.worlds.getByUsername, { username });
      if (current)
        store.setQuery(
          api.worlds.getByUsername,
          { username },
          { ...current, cometReview: enabled },
        );
    },
  });

  return (
    <section aria-label="Your world" className="flex flex-col gap-4">
      <Button asChild variant="secondary" size="sm" className="self-start">
        <Link href="/create">
          <PenLine aria-hidden />
          Edit my world
        </Link>
      </Button>
      <div className="flex items-start gap-3">
        <Switch
          id={switchId}
          checked={cometReview}
          disabled={!online}
          aria-describedby={hintId}
          onCheckedChange={(enabled) => void setReview.run({ worldId, enabled })}
          className="mt-0.5"
        />
        <div className="flex flex-col gap-1">
          <label htmlFor={switchId} className="wl-label text-text">
            Review comets before they appear
          </label>
          <p id={hintId} className="wl-small text-text-muted">
            {online
              ? "New comets wait for you to approve them."
              : "You're offline. Reconnect to change this."}
          </p>
        </div>
      </div>
    </section>
  );
}
