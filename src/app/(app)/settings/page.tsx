import type { Metadata } from "next";

import { AccountGate } from "@/features/auth/account-gate";
import { SignOutEverywhere } from "@/features/auth/sign-out-everywhere";

export const metadata: Metadata = { title: "Settings · Worldling" };

// Profile, email preferences, blocked users, export and deletion join this page in their phases.
export default function SettingsPage() {
  return (
    <AccountGate>
      <div className="mx-auto flex w-full max-w-panel flex-col gap-6 px-4 py-10 sm:px-6">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Settings</h1>
        <SignOutEverywhere />
      </div>
    </AccountGate>
  );
}
