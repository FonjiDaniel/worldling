"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type SyntheticEvent, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldError, Label } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { normalizeEmail, savePendingFlow } from "./flow-state";
import {
  AuthHeading,
  Divider,
  FormAlert,
  OfflineHint,
  PasswordInput,
  useCanSubmit,
} from "./form-parts";
import { GoogleButton } from "./google-button";
import { safeNextPath } from "./routes";
import { useAuthStep } from "./use-auth-step";

const linkClass = "text-link underline-offset-4 hover:underline";

export function SignInForm() {
  const router = useRouter();
  const next = safeNextPath(useSearchParams().get("next"));
  const ids = { email: useId(), password: useId() };
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const { run, pending, error } = useAuthStep();
  const canSubmit = useCanSubmit();

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError(null);
    const normalized = normalizeEmail(email);
    if (normalized === "" || password === "") {
      setLocalError("Enter your email and password.");
      return;
    }
    const result = await run("password", { email: normalized, password, flow: "signIn" });
    if (!result.ok) return;
    if (result.signedIn) {
      router.replace(next);
      return;
    }
    // The account exists but the email was never verified, so a fresh code is on its way.
    savePendingFlow({ email: normalized, next });
    router.push("/verify");
  }

  return (
    <div className="flex flex-col gap-6">
      <AuthHeading title="Welcome back">Your world has been waiting.</AuthHeading>
      <GoogleButton next={next} onError={setLocalError} />
      <Divider label="or use your email" />
      <form
        noValidate
        onSubmit={(event) => void handleSubmit(event)}
        className="flex flex-col gap-4"
      >
        <FormAlert message={localError ?? error?.message ?? null} />
        <Field>
          <Label htmlFor={ids.email}>Email</Label>
          <Input
            id={ids.email}
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
            }}
          />
          <FieldError>{error?.fieldErrors.email}</FieldError>
        </Field>
        <Field>
          <div className="flex items-baseline justify-between gap-2">
            <Label htmlFor={ids.password}>Password</Label>
            <Link href="/reset-password" className={`text-sm ${linkClass}`}>
              Forgot it?
            </Link>
          </div>
          <PasswordInput
            id={ids.password}
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
            }}
          />
        </Field>
        <Button type="submit" size="lg" pending={pending} disabled={!canSubmit} className="w-full">
          Sign in
        </Button>
        <OfflineHint />
      </form>
      <p className="text-center text-sm text-text-muted">
        New here?{" "}
        <Link href={{ pathname: "/sign-up", query: { next } }} className={linkClass}>
          Create your world
        </Link>
      </p>
    </div>
  );
}
