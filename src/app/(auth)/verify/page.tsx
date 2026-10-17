import type { Metadata } from "next";

import { VerifyForm } from "@/features/auth/verify-form";

export const metadata: Metadata = { title: "Check your email · Worldling" };

export default function VerifyPage() {
  return <VerifyForm />;
}
