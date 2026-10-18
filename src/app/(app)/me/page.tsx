import type { Metadata } from "next";

import { AccountGate } from "@/features/auth/account-gate";
import { MeRedirect } from "@/features/auth/me-redirect";

export const metadata: Metadata = { title: "Your world · Worldling" };

export default function MePage() {
  return (
    <AccountGate>
      <MeRedirect />
    </AccountGate>
  );
}
