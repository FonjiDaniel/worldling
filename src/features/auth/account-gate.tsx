"use client";

import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import type { Route } from "next";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { Button } from "@/components/ui/button";
import { api } from "@convex/_generated/api";

import { MaintenanceScreen, SuspendedScreen } from "./account-screens";

type Need = "onboarded" | "not-onboarded";
type Me = FunctionReturnType<typeof api.profiles.me>;

function redirectFor(me: Me | undefined, need: Need, pathname: string): Route | null {
  if (me === undefined || me === null) return null;
  if (need === "onboarded" && me.needsOnboarding) {
    return `/onboarding?next=${encodeURIComponent(pathname)}` as Route;
  }
  if (need === "not-onboarded" && !me.needsOnboarding) return "/me";
  return null;
}

function Centered({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-panel flex-1 flex-col justify-center px-4 py-16">
      {children}
    </div>
  );
}

/**
 * Picks the screen for the viewer's account state (SPEC §2.8, §6.3, §6.4). UX only: every
 * Convex function enforces the same rules (ADR-010). Signed-out visitors rarely get here,
 * since the proxy redirects them first.
 */
export function AccountGate({
  need = "onboarded",
  children,
}: {
  need?: Need;
  children: ReactNode;
}) {
  const me = useQuery(api.profiles.me);
  const status = useQuery(api.system.status);
  const router = useRouter();
  const pathname = usePathname();

  const redirect = redirectFor(me, need, pathname);

  useEffect(() => {
    if (redirect !== null) router.replace(redirect);
  }, [redirect, router]);

  if (me === undefined || status === undefined || redirect !== null) {
    return (
      <Centered>
        <LoadingState label="Finding your world" />
      </Centered>
    );
  }
  if (me === null) {
    return (
      <Centered>
        <EmptyState
          title="Sign in to keep going"
          description="Your world is waiting on the other side."
          action={
            <Button asChild>
              <a href={`/sign-in?next=${encodeURIComponent(pathname)}`}>Sign in</a>
            </Button>
          }
        />
      </Centered>
    );
  }
  if (status.maintenance.enabled && me.profile?.role !== "admin") {
    return <MaintenanceScreen message={status.maintenance.message} />;
  }
  if (me.profile?.status === "suspended") {
    return <SuspendedScreen reason={me.profile.suspensionReason} />;
  }
  return <>{children}</>;
}
