"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { OfflineHint, useCanSubmit } from "@/features/auth/form-parts";
import { useAppMutation } from "@/hooks/use-app-mutation";
import { api } from "@convex/_generated/api";
import type { FunctionReturnType } from "convex/server";

import { useAnnounce } from "./announcer";
import { saveDraft } from "./draft";
import { normalizeName, sameWorld } from "./edits";
import { worldNameProblem } from "./names";
import { useCreatorStore, useCreatorWorld } from "./store";
import { useThumbnailUpload } from "./use-thumbnail-upload";

export type OwnedWorld = NonNullable<FunctionReturnType<typeof api.worlds.mine>>;

/** "Claim this world": keep the draft, then sign up (or finish onboarding) to claim it. */
export function ClaimButton({
  signedIn,
  onNameProblem,
}: {
  signedIn: boolean;
  onNameProblem: () => void;
}) {
  const router = useRouter();
  const store = useCreatorStore();
  const canSubmit = useCanSubmit();

  return (
    <div className="flex flex-col gap-2">
      <Button
        size="lg"
        className="w-full"
        disabled={!canSubmit}
        onClick={() => {
          const world = store.getState().history.present;
          if (worldNameProblem(world.name) !== null) {
            onNameProblem();
            return;
          }
          saveDraft(world);
          const next: Route = signedIn ? "/onboarding" : "/sign-up?next=%2Fonboarding";
          router.push(next);
        }}
      >
        Claim this world
      </Button>
      <OfflineHint />
    </div>
  );
}

/** "Save my world" for owners. The screen shows the save at once (optimistic). */
export function SaveButton({
  world,
  onNameProblem,
}: {
  world: OwnedWorld;
  onNameProblem: () => void;
}) {
  const present = useCreatorWorld();
  const announce = useAnnounce();
  const canSubmit = useCanSubmit();
  const uploadThumbnail = useThumbnailUpload();
  const { run, isPending } = useAppMutation(api.worlds.update, {
    optimisticUpdate: (local, args) => {
      const current = local.getQuery(api.worlds.mine, {});
      if (current === undefined || current === null) return;
      local.setQuery(
        api.worlds.mine,
        {},
        {
          ...current,
          ...(args.name !== undefined && { name: normalizeName(args.name) }),
          ...(args.params !== undefined && { params: args.params }),
        },
      );
    },
  });
  const dirty = !sameWorld(present, world);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => {
      window.removeEventListener("beforeunload", warn);
    };
  }, [dirty]);

  const save = async () => {
    if (worldNameProblem(present.name) !== null) {
      onNameProblem();
      return;
    }
    const result = await run({
      worldId: world._id,
      name: normalizeName(present.name),
      params: present.params,
    });
    if (!result.ok) {
      if (result.error.details?.fieldErrors?.name !== undefined) onNameProblem();
      else announce("We couldn't save your changes. Try again.");
      return;
    }
    announce("Saved. Your world is up to date.");
    void uploadThumbnail(world._id, present.params, world.level);
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        size="lg"
        className="w-full"
        pending={isPending}
        disabled={!dirty || !canSubmit}
        onClick={() => void save()}
      >
        {dirty ? "Save my world" : "Saved"}
      </Button>
      <OfflineHint />
    </div>
  );
}
