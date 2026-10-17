"use client";

import { useQuery } from "convex/react";
import { Sparkles } from "lucide-react";

import { LoadingState } from "@/components/shared/loading-state";
import { api } from "@convex/_generated/api";

/** The landing spot after onboarding until world pages arrive (Phase 7). */
export function WorldBorn() {
  const me = useQuery(api.profiles.me);
  if (me?.profile === undefined) return <LoadingState label="Finding your world" />;
  if (me.profile === null) return null;
  return (
    <section className="mx-auto flex w-full max-w-panel flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <span
        aria-hidden
        className="flex size-16 items-center justify-center rounded-full bg-gradient-brand text-on-primary [&_svg]:size-8"
      >
        <Sparkles />
      </span>
      <h1 className="font-display text-3xl font-semibold tracking-tight">Your world is born</h1>
      <p role="status" className="max-w-prose text-lg text-text-muted">
        Welcome, {me.profile.displayName}. Your world is spinning at{" "}
        <span className="font-mono text-text">/w/{me.profile.username}</span>. Soon you&apos;ll be
        able to tend it, visit others and send comets.
      </p>
    </section>
  );
}
