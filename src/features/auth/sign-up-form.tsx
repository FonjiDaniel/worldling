"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type SyntheticEvent, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldHint, Label } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { checkPassword, PASSWORD_MIN_LENGTH, PASSWORD_PROBLEM_COPY } from "@convex/shared/password";

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

export function SignUpForm() {
  const router = useRouter();
  const next = safeNextPath(useSearchParams().get("next"));
  const ids = { email: useId(), password: useId(), hint: useId(), passwordError: useId() };
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const { run, pending, error } = useAuthStep();
  const canSubmit = useCanSubmit();

  const passwordCheck = checkPassword(password);
  const passwordError =
    error?.fieldErrors.password ??
    (touched && !passwordCheck.ok ? PASSWORD_PROBLEM_COPY[passwordCheck.problem] : undefined);

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(true);
    setLocalError(null);
    if (!passwordCheck.ok) return;
    const normalized = normalizeEmail(email);
    const result = await run("password", { email: normalized, password, flow: "signUp" });
    if (!result.ok) return;
    if (result.signedIn) {
      router.replace(next);
      return;
    }
    savePendingFlow({ email: normalized, next });
    router.push("/verify");
  }

  return (
    <div className="flex flex-col gap-6">
      <AuthHeading title="Create your world">
        A tiny planet of your own, ready in a minute.
      </AuthHeading>
      <GoogleButton next={next} onError={setLocalError} />
      <Divider label="or use your email" />
      <form
        noValidate
        onSubmit={(event) => void handleSubmit(event)}
        className="flex flex-col gap-4"
      >
        <FormAlert
          message={localError ?? (error && !error.fieldErrors.password ? error.message : null)}
        />
        <Field>
          <Label htmlFor={ids.email}>Email</Label>
          <Input
            id={ids.email}
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            value={email}
            aria-invalid={error?.fieldErrors.email !== undefined || undefined}
            onChange={(event) => {
              setEmail(event.target.value);
            }}
          />
          <FieldError>{error?.fieldErrors.email}</FieldError>
        </Field>
        <Field>
          <Label htmlFor={ids.password}>Password</Label>
          <PasswordInput
            id={ids.password}
            autoComplete="new-password"
            required
            minLength={PASSWORD_MIN_LENGTH}
            value={password}
            aria-invalid={passwordError !== undefined || undefined}
            aria-describedby={`${ids.hint} ${ids.passwordError}`}
            onChange={(event) => {
              setPassword(event.target.value);
            }}
            onBlur={() => {
              if (password !== "") setTouched(true);
            }}
          />
          <FieldHint id={ids.hint}>
            At least {PASSWORD_MIN_LENGTH} characters. A few words strung together work well.
          </FieldHint>
          <FieldError id={ids.passwordError}>{passwordError}</FieldError>
        </Field>
        <Button type="submit" size="lg" pending={pending} disabled={!canSubmit} className="w-full">
          Create my world
        </Button>
        <OfflineHint />
      </form>
      <p className="text-center text-sm text-text-muted">
        Already have a world?{" "}
        <Link
          href={{ pathname: "/sign-in", query: { next } }}
          className="text-link underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
