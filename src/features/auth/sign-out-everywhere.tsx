"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAppMutation } from "@/hooks/use-app-mutation";
import { api } from "@convex/_generated/api";

/** Ends every session, this one included (SPEC §6.4). */
export function SignOutEverywhere() {
  const router = useRouter();
  const { signOut } = useAuthActions();
  const { run, isPending } = useAppMutation(api.sessions.signOutEverywhere);
  const [open, setOpen] = useState(false);

  async function confirm() {
    const result = await run({});
    if (!result.ok) return;
    // The server already removed this session; signOut clears the local tokens and cookies.
    await signOut().catch(() => undefined);
    setOpen(false);
    router.replace("/sign-in");
  }

  return (
    <section
      aria-labelledby="security-heading"
      className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-panel-pad shadow-panel md:p-panel-pad-lg"
    >
      <h2 id="security-heading" className="wl-h4">
        Sign out everywhere
      </h2>
      <p className="wl-body text-text-muted">
        Lost a phone or used a shared computer? This signs you out on every device, including this
        one.
      </p>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!isPending) setOpen(next);
        }}
      >
        <DialogTrigger asChild>
          <Button variant="secondary" className="self-start">
            <LogOut aria-hidden />
            Sign out of all devices
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign out of all devices?</DialogTitle>
            <DialogDescription>
              You&apos;ll need to sign in again everywhere, here too.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              disabled={isPending}
              onClick={() => {
                setOpen(false);
              }}
            >
              Stay signed in
            </Button>
            <Button variant="danger" pending={isPending} onClick={() => void confirm()}>
              Sign out everywhere
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
