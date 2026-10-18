"use client";

import { useQuery } from "convex/react";
import { useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { Button } from "@/components/ui/button";
import { MaintenanceScreen, SuspendedScreen } from "@/features/auth/account-screens";
import { useIsClient } from "@/hooks/use-media-query";
import { api } from "@convex/_generated/api";

import { AnnouncerProvider, useAnnounce } from "./announcer";
import { ClaimButton, type OwnedWorld, SaveButton } from "./creator-cta";
import { CreatorLayout } from "./creator-layout";
import { clearDraft, loadDraft } from "./draft";
import { type CreatorWorld, freshWorld } from "./edits";
import { CreatorProvider, useCreatorStore } from "./store";
import { useDraftAutosave } from "./use-draft-autosave";

// /create (SPEC §2.2): guests (and signed-in people who haven't onboarded yet) shape a draft
// and claim it; owners edit their world and save it.

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-panel flex-1 flex-col justify-center px-4 py-16">
      {children}
    </div>
  );
}

export function CreatorScreen() {
  const isClient = useIsClient();
  const me = useQuery(api.profiles.me);
  const status = useQuery(api.system.status);
  const isOwner = me?.profile?.status === "active";
  const mine = useQuery(api.worlds.mine, isOwner ? {} : "skip");

  if (!isClient || me === undefined || status === undefined || (isOwner && mine === undefined)) {
    return (
      <Centered>
        <LoadingState label="Finding your world" />
      </Centered>
    );
  }
  if (status.maintenance.enabled && me?.profile?.role !== "admin") {
    return <MaintenanceScreen message={status.maintenance.message} />;
  }
  if (me?.profile?.status === "suspended") {
    return <SuspendedScreen reason={me.profile.suspensionReason} />;
  }
  if (isOwner) {
    if (mine === null || mine === undefined) {
      return (
        <Centered>
          <EmptyState
            title="Your world starts here."
            description="We couldn't find your world. Try again in a moment."
          />
        </Centered>
      );
    }
    return <OwnerCreator world={mine} />;
  }
  return <GuestCreator signedIn={me !== null} />;
}

function GuestCreator({ signedIn }: { signedIn: boolean }) {
  const [initial] = useState<CreatorWorld>(() => loadDraft() ?? freshWorld());
  return (
    <CreatorProvider initial={initial}>
      <AnnouncerProvider>
        <GuestAutosave />
        <CreatorLayout
          cta={(onNameProblem) => <ClaimButton signedIn={signedIn} onNameProblem={onNameProblem} />}
        />
      </AnnouncerProvider>
    </CreatorProvider>
  );
}

function GuestAutosave() {
  useDraftAutosave(true);
  return null;
}

function OwnerCreator({ world }: { world: OwnedWorld }) {
  const [initial] = useState<CreatorWorld>(() => ({
    name: world.name,
    params: world.params,
    nameEdited: true,
  }));
  const [draft, setDraft] = useState(loadDraft);
  return (
    <CreatorProvider initial={initial}>
      <AnnouncerProvider>
        <CreatorLayout
          banner={
            draft === null ? undefined : (
              <DraftBanner
                draft={draft}
                onDone={() => {
                  clearDraft();
                  setDraft(null);
                }}
              />
            )
          }
          cta={(onNameProblem) => <SaveButton world={world} onNameProblem={onNameProblem} />}
        />
      </AnnouncerProvider>
    </CreatorProvider>
  );
}

/** A world made while signed out, offered to an owner who already has one. */
function DraftBanner({ draft, onDone }: { draft: CreatorWorld; onDone: () => void }) {
  const store = useCreatorStore();
  const announce = useAnnounce();
  return (
    <div
      role="region"
      aria-label="A world you made earlier"
      className="flex flex-col gap-3 rounded-md border border-line bg-surface-raised p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="wl-small text-text">You made a world while signed out. Use it here?</p>
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => {
            store.getState().change(draft, "your earlier world");
            announce("Your earlier world is here. Save to keep it.");
            onDone();
          }}
        >
          Use the world you made
        </Button>
        <Button size="sm" variant="ghost" onClick={onDone}>
          Keep my world
        </Button>
      </div>
    </div>
  );
}
