import type { Metadata } from "next";

import { AccountGate } from "@/features/auth/account-gate";
import { OnboardingForm } from "@/features/auth/onboarding-form";

export const metadata: Metadata = { title: "Name your corner of space · Worldling" };

export default function OnboardingPage() {
  return (
    <AccountGate need="not-onboarded">
      <OnboardingForm />
    </AccountGate>
  );
}
