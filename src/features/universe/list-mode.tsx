"use client";

import { usePaginatedQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import Link from "next/link";
import type { CSSProperties } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { Button, buttonVariants } from "@/components/ui/button";
import { api } from "@convex/_generated/api";

import { copy } from "./copy";

// List mode (SPEC §2.5): every world as text, newest first. No WebGL needed, so it is also the
// tier 0 universe (§8.9).

const PAGE = 24;

type ListedWorld = FunctionReturnType<typeof api.universe.list>["page"][number];

function WorldThumb({ world }: { world: ListedWorld }) {
  if (world.thumbUrl !== null) {
    return (
      // Thumbnails are small WebP files from Convex storage; next/image adds nothing here.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={world.thumbUrl} alt="" loading="lazy" className="size-16 shrink-0 rounded-full" />
    );
  }
  const style = { "--pin-a": world.colorA, "--pin-b": world.colorB } as CSSProperties;
  return <span aria-hidden style={style} className="size-16 shrink-0 rounded-full pin-disc" />;
}

function WorldRow({ world }: { world: ListedWorld }) {
  return (
    <li>
      <Link
        href={`/w/${world.username}`}
        className="flex items-center gap-4 rounded-lg border border-line bg-surface p-4 transition-colors duration-fast ease-out hover:bg-surface-raised"
      >
        <WorldThumb world={world} />
        <span className="flex min-w-0 flex-col gap-1">
          <span className="wl-label break-words text-text" data-user-text>
            {world.name}
          </span>
          <span className="wl-small text-text-muted">
            {copy.byUser(world.username)} · {copy.level(world.level)}
          </span>
          <span className="wl-small text-text-muted">{world.description}</span>
        </span>
      </Link>
    </li>
  );
}

export function ListMode({ note }: { note?: string }) {
  const { results, status, loadMore } = usePaginatedQuery(
    api.universe.list,
    {},
    { initialNumItems: PAGE },
  );
  return (
    <section
      aria-labelledby="universe-list-heading"
      className="mx-auto flex w-full max-w-page flex-col gap-4 px-4 pt-28 pb-10 sm:px-6"
    >
      <h2 id="universe-list-heading" className="wl-h3 text-text">
        {copy.listHeading}
      </h2>
      {note ? <p className="wl-body text-text-muted">{note}</p> : null}
      {status === "LoadingFirstPage" ? <LoadingState label={copy.listLoading} /> : null}
      {status === "Exhausted" && results.length === 0 ? (
        <EmptyState
          title={copy.listEmpty}
          action={
            <Link href="/create" className={buttonVariants()}>
              {copy.listEmptyAction}
            </Link>
          }
        />
      ) : null}
      <ul className="grid gap-3 md:grid-cols-2">
        {results.map((world) => (
          <WorldRow key={world.id} world={world} />
        ))}
      </ul>
      {status === "CanLoadMore" || status === "LoadingMore" ? (
        <Button
          variant="secondary"
          className="self-center"
          disabled={status === "LoadingMore"}
          onClick={() => {
            loadMore(PAGE);
          }}
        >
          {copy.listMore}
        </Button>
      ) : null}
      <p role="status" aria-live="polite" className="sr-only">
        {status === "LoadingMore" ? copy.listLoading : ""}
      </p>
    </section>
  );
}
