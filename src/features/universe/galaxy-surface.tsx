"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type KeyboardEvent, useRef } from "react";

import { LoadingState } from "@/components/shared/loading-state";
import { Button, buttonVariants } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/utils";
import { ThreeView } from "@/three/ThreeView";
import { GalaxyScene } from "@/three/universe/GalaxyScene";
import { cycleIndex, galaxyAction } from "@/three/universe/keyboard";
import { nearest } from "@/three/universe/selection";
import { type UniversePin, useUniverse } from "@/three/universe/store";

import { copy } from "./copy";

// The galaxy region (SPEC §2.5): the 3D view plus its DOM layer, the name tag, the Skip control,
// the reduced-motion fade and the card for the world the camera arrived at.

const NEARBY = 8;

function nearbyWorlds(): UniversePin[] {
  const { rig, pins } = useUniverse.getState();
  const point = { x: 0, z: 0 };
  rig?.groundPoint(point);
  return nearest(pins.values(), point.x, 0, point.z, NEARBY);
}

function useGalaxyKeys() {
  const router = useRouter();
  const cycle = useRef<UniversePin[]>([]);
  return (event: KeyboardEvent<HTMLDivElement>) => {
    const action = galaxyAction(event.key, event.shiftKey);
    if (action === null || event.altKey || event.metaKey || event.ctrlKey) return;
    const { rig, focused, selected, setFocused, setSelected } = useUniverse.getState();
    if (action.kind === "cycle") {
      if (focused === null) cycle.current = nearbyWorlds();
      const current = cycle.current.findIndex((pin) => pin.slot === focused?.slot);
      const next = cycleIndex(current < 0 ? null : current, action.step, cycle.current.length);
      // Past the last world, Tab moves on to the next control (no keyboard trap).
      setFocused(next === null ? null : (cycle.current[next] ?? null));
      if (next !== null) event.preventDefault();
      return;
    }
    event.preventDefault();
    if (action.kind === "pan") rig?.pan(action.right, action.forward);
    if (action.kind === "zoom") rig?.zoom(action.direction);
    if (action.kind === "clear") {
      rig?.stop();
      setFocused(null);
      setSelected(null);
    }
    const target = focused ?? selected;
    if (action.kind === "visit" && target !== null) router.push(`/w/${target.username}`);
  };
}

function NameTag() {
  const setLabel = useUniverse((state) => state.setLabel);
  const pin = useUniverse((state) => state.hovered ?? state.focused);
  return (
    <div
      ref={setLabel}
      aria-hidden
      className="pointer-events-none invisible absolute top-0 left-0 rounded-full border border-line glass px-3 py-1 wl-small whitespace-nowrap text-text"
    >
      {pin ? (
        <>
          <span className="wl-label">{pin.name}</span>
          <span className="text-text-muted"> @{pin.username}</span>
        </>
      ) : null}
    </div>
  );
}

function FocusAnnouncer() {
  const focused = useUniverse((state) => state.focused);
  return (
    <p role="status" aria-live="polite" className="sr-only">
      {focused ? copy.focusAnnouncement(focused.name, focused.username, focused.level) : ""}
    </p>
  );
}

function SkipFlight() {
  const flight = useUniverse((state) => state.flight);
  const rig = useUniverse((state) => state.rig);
  if (!flight.skippable) return null;
  return (
    <Button
      variant="secondary"
      className="absolute bottom-24 left-1/2 -translate-x-1/2 animate-fade-in"
      onClick={() => {
        rig?.skip();
      }}
    >
      {copy.skip}
    </Button>
  );
}

function ArrivalCard() {
  const selected = useUniverse((state) => state.selected);
  const flying = useUniverse((state) => state.flight.active);
  const setSelected = useUniverse((state) => state.setSelected);
  if (selected === null || flying) return null;
  return (
    <section
      aria-label={selected.name}
      className="absolute inset-x-18 bottom-4 mx-auto flex max-w-panel animate-panel-in flex-col gap-3 rounded-lg border border-line glass p-4 shadow-panel sm:inset-x-auto sm:right-18 sm:w-panel"
    >
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="wl-h4 break-words text-text">{selected.name}</h2>
          <p className="wl-small text-text-muted">
            {copy.byUser(selected.username)} · {copy.level(selected.level)}
          </p>
        </div>
        <IconButton
          label="Close"
          icon={<X />}
          onClick={() => {
            setSelected(null);
          }}
        />
      </header>
      <Link href={`/w/${selected.username}`} className={cn(buttonVariants(), "w-full")}>
        {copy.visit}
      </Link>
    </section>
  );
}

export function GalaxySurface() {
  const setSurface = useUniverse((state) => state.setSurface);
  const scrim = useUniverse((state) => state.scrim);
  const onKeyDown = useGalaxyKeys();
  return (
    <div className="absolute inset-0">
      <ThreeView
        ref={setSurface}
        role="application"
        tabIndex={0}
        label={copy.galaxyLabel}
        onKeyDown={onKeyDown}
        onBlur={() => {
          useUniverse.getState().setFocused(null);
        }}
        className="size-full touch-none focus-visible:outline-offset-[calc(var(--focus-ring-width)*-1)]"
        fallback={
          <div className="flex size-full items-center justify-center">
            <LoadingState label={copy.loading} />
          </div>
        }
      >
        <GalaxyScene />
      </ThreeView>
      <NameTag />
      <FocusAnnouncer />
      <SkipFlight />
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 bg-void transition-opacity duration-reduced ease-out",
          scrim ? "opacity-100" : "opacity-0",
        )}
      />
      <ArrivalCard />
    </div>
  );
}
