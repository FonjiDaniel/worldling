"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { ChevronDown, LogOut, Settings } from "lucide-react";
import Link from "next/link";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { api } from "@convex/_generated/api";

import { useSignOut } from "./account-screens";

const itemClass =
  "flex min-h-touch w-full items-center gap-2 rounded-sm px-3 text-left text-text hover:bg-surface-raised [&_svg]:size-4";

/** Header account control: sign in when signed out, a small menu when signed in. */
export function AccountMenu() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const me = useQuery(api.profiles.me, isAuthenticated ? {} : "skip");
  const { signOut, pending } = useSignOut();

  if (isLoading) return null;
  if (!isAuthenticated) {
    return (
      <Button asChild variant="secondary" size="sm">
        <Link href="/sign-in">Sign in</Link>
      </Button>
    );
  }
  const name = me?.profile?.displayName ?? "You";
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={`Account menu for ${name}`}>
          <Avatar name={name} size="sm" />
          <span className="hidden sm:inline">{name}</span>
          <ChevronDown aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="flex w-56 flex-col gap-1 p-1">
        <Link href="/settings" className={itemClass}>
          <Settings aria-hidden />
          Settings
        </Link>
        <button
          type="button"
          className={itemClass}
          disabled={pending}
          onClick={() => void signOut()}
        >
          <LogOut aria-hidden />
          Sign out
        </button>
      </PopoverContent>
    </Popover>
  );
}
