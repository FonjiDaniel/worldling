import type { Metadata } from "next";

import { SignUpForm } from "@/features/auth/sign-up-form";

export const metadata: Metadata = { title: "Create your world · Worldling" };

export default function SignUpPage() {
  return <SignUpForm />;
}
