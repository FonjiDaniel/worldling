"use client";

import { useQuery } from "convex/react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { LoadingState } from "@/components/shared/loading-state";
import { api } from "@convex/_generated/api";

/** /me goes to the viewer's own world page (SPEC §2.1). */
export function MeRedirect() {
  const me = useQuery(api.profiles.me);
  const router = useRouter();
  const username = me?.profile?.username;
  useEffect(() => {
    if (username !== undefined) router.replace(`/w/${username}` as Route);
  }, [username, router]);
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <LoadingState label="Finding your world" />
    </div>
  );
}
