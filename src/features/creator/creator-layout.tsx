"use client";

import { type ReactNode, useId, useState } from "react";

import { useBreakpoint } from "@/hooks/use-media-query";

import { CreatorSheet } from "./creator-sheet";
import { CreatorToolbar } from "./creator-toolbar";
import { CreatorPanel } from "./panel/creator-panel";
import { NAME_INPUT_ID } from "./panel/name-field";
import { PlanetStage } from "./planet-stage";
import { useCreator, useCreatorStore } from "./store";
import { type CreatorActions, useCreatorActions } from "./use-creator-actions";
import { useCreatorShortcuts } from "./use-creator-shortcuts";

// Desktop follows the 06 creator mockup: the world on the left, a glass panel on the right.
// Below lg the panel becomes a bottom sheet and the world keeps the top of the screen (§3.6).

function PanelHeader({ headingId, compact }: { headingId: string; compact?: boolean }) {
  const name = useCreator((state) => state.history.present.name);
  const shown = name.trim() === "" ? "No name yet" : name;
  if (compact) {
    return (
      <div className="flex min-w-0 items-baseline gap-2">
        <h2 id={headingId} className="shrink-0 wl-h4 text-text">
          Your world
        </h2>
        <p className="truncate wl-small text-text-muted">{shown}</p>
      </div>
    );
  }
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <h2 id={headingId} className="wl-h3 text-text">
        Your world
      </h2>
      <p className="truncate wl-body text-text-muted">{shown}</p>
    </div>
  );
}

export type CtaRender = (onNameProblem: () => void) => ReactNode;

export function CreatorLayout({ cta, banner }: { cta: CtaRender; banner?: ReactNode }) {
  const desktop = useBreakpoint("lg");
  const store = useCreatorStore();
  const actions = useCreatorActions();
  const headingId = useId();
  const [showNameProblem, setShowNameProblem] = useState(false);

  useCreatorShortcuts((shortcut) => {
    if (shortcut === "undo") actions.undo();
    else actions.redo();
  });

  const onNameProblem = () => {
    setShowNameProblem(true);
    const state = store.getState();
    state.setTab("details");
    if (state.snap === "peek") state.setSnap("half");
    requestAnimationFrame(() => {
      document.getElementById(NAME_INPUT_ID)?.focus();
    });
  };

  const panel = (
    <CreatorPanel
      actions={actions}
      showNameProblem={showNameProblem}
      onTabChange={(tab) => {
        store.getState().setTab(tab);
      }}
    />
  );

  return desktop ? (
    <DesktopCreator actions={actions} headingId={headingId} banner={banner}>
      {panel}
      {cta(onNameProblem)}
    </DesktopCreator>
  ) : (
    <div className="flex flex-col">
      <h1 className="sr-only">Make it yours.</h1>
      {banner === undefined ? null : <div className="px-4 pt-3">{banner}</div>}
      <div className="flex h-[calc(60dvh-(--spacing(18)))] flex-col items-center gap-2 px-4 pt-2 pb-3">
        <PlanetStage className="min-h-0 w-full flex-1" caption={false} />
        <CreatorToolbar actions={actions} />
      </div>
      <CreatorSheet footer={cta(onNameProblem)}>
        <PanelHeader headingId={headingId} compact />
        {panel}
      </CreatorSheet>
    </div>
  );
}

function DesktopCreator({
  actions,
  headingId,
  banner,
  children,
}: {
  actions: CreatorActions;
  headingId: string;
  banner: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto grid w-full max-w-page flex-1 grid-cols-[minmax(0,1fr)_var(--container-creator)] items-start gap-10 px-6 py-10">
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-3">
          <p className="wl-caption font-semibold tracking-wide text-accent uppercase">
            Your own small world
          </p>
          <h1 className="wl-display text-text">Make it yours.</h1>
          <p className="wl-body-lg text-text-muted">
            A little color. A little care. A world to call home.
          </p>
        </header>
        {banner}
        <PlanetStage className="h-[min(62dvh,var(--container-creator))] gap-3" />
        <CreatorToolbar actions={actions} className="justify-center" />
      </div>
      <aside
        aria-labelledby={headingId}
        className="sticky top-24 flex max-h-[calc(100dvh-(--spacing(28)))] flex-col gap-4 glass-panel"
      >
        <PanelHeader headingId={headingId} />
        {children}
      </aside>
    </div>
  );
}
