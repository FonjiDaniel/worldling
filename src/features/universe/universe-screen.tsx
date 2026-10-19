"use client";

import { useQuery } from "convex/react";
import { Minus, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { UniverseIcon } from "@/components/icons/universe";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { useIsClient } from "@/hooks/use-media-query";
import { useEffectiveTier } from "@/stores/experience";
import { placePin, type SectorPin, useUniverse } from "@/three/universe/store";
import { api } from "@convex/_generated/api";

import { copy } from "./copy";
import { GalaxySurface } from "./galaxy-surface";
import { ListMode } from "./list-mode";
import { UniverseData } from "./universe-data";
import { useBirthToasts } from "./use-birth-toasts";
import { usePerfTour } from "./use-perf-tour";
import { type FoundWorld, WorldSearch } from "./world-search";

// /universe (SPEC §2.5): the galaxy with search, rails and zoom over it, or the same worlds as a
// list. Tier 0 (no WebGL) always gets the list (§8.9).

type Mode = "galaxy" | "list";

function flyTo(world: SectorPin): void {
  const { rig, setSelected, setFocused } = useUniverse.getState();
  const pin = placePin(world);
  setFocused(null);
  setSelected(pin);
  rig?.flyTo(pin);
}

/** Opens on `?w=username` when given, otherwise on the whole galaxy. Runs once. */
function useOpeningShot(focus: string | null): void {
  const rig = useUniverse((state) => state.rig);
  const slotCount = useUniverse((state) => state.slotCount);
  const found = useQuery(api.universe.search, focus === null ? "skip" : { q: focus });
  const done = useRef(false);
  useEffect(() => {
    if (done.current || rig === null || slotCount === 0) return;
    if (focus !== null && found === undefined) return;
    done.current = true;
    rig.overview();
    const match = found?.find((world) => world.username === focus?.toLowerCase());
    if (match) flyTo(match);
  }, [rig, slotCount, focus, found]);
}

function Rails() {
  const featured = useQuery(api.universe.featured, {});
  const justBorn = useQuery(api.universe.justBorn, {});
  const rails = [
    { title: copy.featured, worlds: featured ?? [] },
    { title: copy.justBorn, worlds: justBorn ?? [] },
  ].filter((rail) => rail.worlds.length > 0);
  if (rails.length === 0) return null;
  return (
    <nav aria-label={copy.railsLabel} className="flex flex-col gap-2">
      {rails.map((rail) => (
        <div key={rail.title} className="flex scrollbar-none items-center gap-2 overflow-x-auto">
          <h2 className="shrink-0 wl-small text-text-muted">{rail.title}</h2>
          <ul className="flex gap-2">
            {rail.worlds.map((world) => (
              <li key={world.id}>
                <button
                  type="button"
                  onClick={() => {
                    flyTo(world);
                  }}
                  className="min-h-touch pressable rounded-full border border-line glass px-3 wl-small whitespace-nowrap text-text hover:bg-surface-raised"
                >
                  {world.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function useQuietCorner(): boolean {
  return useUniverse((state) => {
    if (state.wanted.length === 0 || state.slotCount === 0) return false;
    return state.wanted.every((key) => state.sectors.get(key)?.length === 0);
  });
}

function GalaxyControls() {
  const rig = useUniverse((state) => state.rig);
  const quiet = useQuietCorner();
  return (
    <>
      <div className="pointer-events-auto absolute bottom-4 left-4 flex flex-col gap-2">
        <IconButton
          variant="secondary"
          label={copy.zoomIn}
          icon={<Plus />}
          onClick={() => {
            rig?.zoom(1);
          }}
        />
        <IconButton
          variant="secondary"
          label={copy.zoomOut}
          icon={<Minus />}
          onClick={() => {
            rig?.zoom(-1);
          }}
        />
        <IconButton
          variant="secondary"
          label={copy.overview}
          icon={<UniverseIcon />}
          onClick={() => {
            rig?.overview();
          }}
        />
      </div>
      {quiet ? (
        <p
          role="status"
          className="absolute top-1/2 left-1/2 -translate-1/2 wl-body text-text-muted"
        >
          {copy.quiet}
        </p>
      ) : null}
    </>
  );
}

function Galaxy({ focus, perf }: { focus: string | null; perf: boolean }) {
  useOpeningShot(focus);
  useBirthToasts();
  usePerfTour(perf);
  return (
    <>
      <UniverseData />
      <GalaxySurface />
    </>
  );
}

export function UniverseScreen({ focus, perf = false }: { focus: string | null; perf?: boolean }) {
  const router = useRouter();
  const isClient = useIsClient();
  const tier = useEffectiveTier();
  const overview = useQuery(api.universe.overview, {});
  const [chosen, setMode] = useState<Mode>("galaxy");
  const forcedList = tier === 0;
  const mode: Mode = forcedList ? "list" : chosen;

  if (overview?.slotCount === 0) {
    return (
      <div className="mx-auto flex w-full max-w-panel flex-1 flex-col justify-center px-4 py-16">
        <h1 className="sr-only">{copy.heading}</h1>
        <EmptyState
          icon={<UniverseIcon />}
          title={copy.quiet}
          action={
            <Link href="/create" className={buttonVariants()}>
              {copy.listEmptyAction}
            </Link>
          }
        />
      </div>
    );
  }

  const onPick = (world: FoundWorld) => {
    if (mode === "list") router.push(`/w/${world.username}`);
    else flyTo(world);
  };

  return (
    <div
      className={
        mode === "galaxy" ? "fixed inset-x-0 top-18 bottom-0 overflow-hidden" : "relative flex-1"
      }
    >
      <h1 className="sr-only">{copy.heading}</h1>
      {mode === "galaxy" && isClient ? <Galaxy focus={focus} perf={perf} /> : null}
      {mode === "list" ? <ListMode {...(forcedList && { note: copy.noWebgl })} /> : null}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col gap-3 p-4 sm:px-6">
        <div className="pointer-events-auto flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="sm:max-w-panel sm:flex-1">
            <WorldSearch onPick={onPick} />
          </div>
          {forcedList ? null : (
            <SegmentedControl<Mode>
              label={copy.modeLabel}
              value={mode}
              onValueChange={setMode}
              className="self-start glass"
              segments={[
                { value: "galaxy", label: copy.modeGalaxy },
                { value: "list", label: copy.modeList },
              ]}
            />
          )}
        </div>
        {mode === "galaxy" ? (
          <div className="pointer-events-auto">
            <Rails />
          </div>
        ) : null}
      </div>
      {mode === "galaxy" && isClient ? <GalaxyControls /> : null}
    </div>
  );
}
