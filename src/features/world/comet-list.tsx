"use client";

import { usePaginatedQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import type { ReactNode } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNow } from "@/hooks/use-now";
import { relativeTime } from "@/lib/relative-time";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

// Comets on a world, newest first (SPEC §2.6). Read-only until Phase 9 adds sending.

export type Comet = FunctionReturnType<typeof api.comets.listForWorld>["page"][number];
export type CometPages = ReturnType<typeof usePaginatedQuery<typeof api.comets.listForWorld>>;

export const COMET_PAGE = 12;
const PENDING_PAGE = 10;

function CometItem({ comet, now }: { comet: Comet; now: number | null }) {
  return (
    <li className="flex flex-col gap-1 border-b border-line py-3 last:border-b-0">
      <p className="wl-body break-words text-text">{comet.body}</p>
      <p className="flex flex-wrap items-center gap-x-2 wl-small text-text-muted">
        <span>{comet.author === null ? "A visitor" : comet.author.displayName}</span>
        <time dateTime={new Date(comet._creationTime).toISOString()} className="wl-timestamp">
          {now === null ? null : relativeTime(comet._creationTime, now)}
        </time>
        {comet.status === "pending" ? <Badge tone="warning">Waiting for your review</Badge> : null}
      </p>
    </li>
  );
}

function PendingComets({ worldId, now }: { worldId: Id<"worlds">; now: number | null }) {
  const pending = usePaginatedQuery(
    api.comets.listForWorld,
    { worldId, status: "pending" },
    { initialNumItems: PENDING_PAGE },
  );
  if (pending.results.length === 0) return null;
  return (
    <ul aria-label="Comets waiting for your review">
      {pending.results.map((comet) => (
        <CometItem key={comet._id} comet={comet} now={now} />
      ))}
    </ul>
  );
}

interface CometListProps {
  worldId: Id<"worlds">;
  comets: CometPages;
  isOwner: boolean;
  /** The owner's share action for the empty state. */
  shareAction: ReactNode;
}

export function CometList({ worldId, comets, isOwner, shareAction }: CometListProps) {
  const now = useNow();
  const { results, status, loadMore } = comets;
  return (
    <section aria-labelledby="comets-heading" className="flex flex-col gap-2">
      <h2 id="comets-heading" className="wl-h4 text-text">
        Comets
      </h2>
      {isOwner ? <PendingComets worldId={worldId} now={now} /> : null}
      {status === "LoadingFirstPage" ? (
        <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading comets">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
      ) : results.length === 0 ? (
        <EmptyState
          title="No comets yet."
          description="Visitors can leave a comet: a short, kind message."
          action={isOwner ? shareAction : undefined}
        />
      ) : (
        <ul aria-label="Comets">
          {results.map((comet) => (
            <CometItem key={comet._id} comet={comet} now={now} />
          ))}
        </ul>
      )}
      {status === "CanLoadMore" ? (
        <Button
          variant="ghost"
          size="sm"
          className="self-start"
          onClick={() => {
            loadMore(COMET_PAGE);
          }}
        >
          Show more comets
        </Button>
      ) : null}
    </section>
  );
}
