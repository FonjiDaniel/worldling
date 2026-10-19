"use client";

import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Search } from "lucide-react";
import { type KeyboardEvent, useId, useState } from "react";

import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { cn } from "@/lib/utils";
import { api } from "@convex/_generated/api";

import { copy } from "./copy";

// Search by username (SPEC §2.5), as an ARIA combobox: type, pick with the arrows, Enter flies
// there. Results are announced in a live region.

export type FoundWorld = FunctionReturnType<typeof api.universe.search>[number];

const DEBOUNCE_MS = 200;

export function WorldSearch({ onPick }: { onPick: (world: FoundWorld) => void }) {
  const online = useOnlineStatus();
  const [text, setText] = useState("");
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const query = useDebouncedValue(text.trim(), DEBOUNCE_MS);
  const results = useQuery(api.universe.search, query === "" || !online ? "skip" : { q: query });
  const listId = useId();
  const hintId = useId();
  const items = results ?? [];
  const showList = open && query !== "" && results !== undefined;

  const pick = (world: FoundWorld | undefined) => {
    if (world === undefined) return;
    setOpen(false);
    setText(`@${world.username}`);
    onPick(world);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActive((index) => (items.length === 0 ? 0 : (index + step + items.length) % items.length));
    } else if (event.key === "Enter") {
      event.preventDefault();
      pick(items[active]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="relative w-full">
      <label htmlFor={`${listId}-input`} className="sr-only">
        {copy.searchLabel}
      </label>
      <Input
        id={`${listId}-input`}
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          showList && items[active] ? `${listId}-${String(active)}` : undefined
        }
        aria-describedby={online ? undefined : hintId}
        autoComplete="off"
        spellCheck={false}
        disabled={!online}
        placeholder={copy.searchPlaceholder}
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => {
          setOpen(true);
        }}
        onBlur={() => {
          setOpen(false);
        }}
        onKeyDown={onKeyDown}
        className="glass pl-12"
      />
      <Search
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-text-muted"
      />
      {online ? null : (
        <p id={hintId} className="mt-1 wl-small text-text-muted">
          {copy.searchOffline}
        </p>
      )}
      <p role="status" aria-live="polite" className="sr-only">
        {showList ? (items.length === 0 ? copy.searchEmpty : copy.searchResults(items.length)) : ""}
      </p>
      {showList ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={copy.searchLabel}
          className="absolute inset-x-0 top-full z-10 mt-2 flex animate-pop-in flex-col rounded-md border border-line bg-surface-raised p-1 shadow-panel"
        >
          {items.length === 0 ? (
            <li className="px-3 py-2 wl-small text-text-muted">{copy.searchEmpty}</li>
          ) : (
            items.map((world, index) => (
              <li
                key={world.id}
                id={`${listId}-${String(index)}`}
                role="option"
                aria-selected={index === active}
                // Keeps focus in the input so the combobox stays open while picking.
                onMouseDown={(event) => {
                  event.preventDefault();
                }}
                onClick={() => {
                  pick(world);
                }}
                className={cn(
                  "flex min-h-touch cursor-pointer flex-col justify-center rounded-sm px-3 py-1",
                  index === active ? "bg-surface text-text" : "text-text-muted",
                )}
              >
                <span className="wl-label text-text">{world.name}</span>
                <span className="wl-small">@{world.username}</span>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
