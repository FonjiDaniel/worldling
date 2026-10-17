import type { Metadata } from "next";

import { AccountGate } from "@/features/auth/account-gate";
import { WorldBorn } from "@/features/auth/world-born";

export const metadata: Metadata = { title: "Your world · Worldling" };

// Phase 7 turns this into a redirect to /w/[username].
export default function MePage() {
  return (
    <AccountGate>
      <WorldBorn />
    </AccountGate>
  );
}
