"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type SyntheticEvent, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldHint, Label } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { OTP_LENGTH, OTP_MINUTES } from "@convex/shared/otp";
import { checkPassword, PASSWORD_MIN_LENGTH, PASSWORD_PROBLEM_COPY } from "@convex/shared/password";

import { normalizeEmail } from "./flow-state";
import { AuthHeading, FormAlert, OfflineHint, PasswordInput, useCanSubmit } from "./form-parts";
import { OtpInput } from "./otp-input";
import { AFTER_SIGN_IN_PATH } from "./routes";
import { useAuthStep, useCountdown } from "./use-auth-step";

const RESEND_COOLDOWN_MS = 30_000;

/** Step one asks for the email; step two takes the code and the new password. */
export function ResetPasswordForm() {
  const [email, setEmail] = useState<string | null>(null);
  return email === null ? <RequestStep onSent={setEmail} /> : <ChooseStep email={email} />;
}

function useRequestCode() {
  const step = useAuthStep();
  const cooldown = useCountdown();
  async function request(email: string): Promise<boolean> {
    const result = await step.run("password", { email, flow: "reset" });
    // Unknown emails look the same as known ones, so nobody can probe who has an account.
    const unknown = !result.ok && result.error.unknownAccount === true;
    if (unknown) step.setError(null);
    if (result.ok || unknown) {
      cooldown.start(RESEND_COOLDOWN_MS);
      return true;
    }
    if (result.error.retryAfterMs !== undefined) cooldown.start(result.error.retryAfterMs);
    return false;
  }
  return { request, pending: step.pending, error: step.error, secondsLeft: cooldown.secondsLeft };
}

function RequestStep({ onSent }: { onSent: (email: string) => void }) {
  const id = useId();
  const [email, setEmail] = useState("");
  const { request, pending, error } = useRequestCode();
  const canSubmit = useCanSubmit();

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = normalizeEmail(email);
    if (normalized === "") return;
    if (await request(normalized)) onSent(normalized);
  }

  return (
    <div className="flex flex-col gap-6">
      <AuthHeading title="Reset your password">
        Tell us your email and we&apos;ll send a code to set a new one.
      </AuthHeading>
      <form
        noValidate
        onSubmit={(event) => void handleSubmit(event)}
        className="flex flex-col gap-4"
      >
        <FormAlert message={error?.message ?? null} />
        <Field>
          <Label htmlFor={id}>Email</Label>
          <Input
            id={id}
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
            }}
          />
        </Field>
        <Button type="submit" size="lg" pending={pending} disabled={!canSubmit} className="w-full">
          Send me a code
        </Button>
        <OfflineHint />
      </form>
      <p className="text-center text-sm text-text-muted">
        Remembered it?{" "}
        <Link href="/sign-in" className="text-link underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

function ChooseStep({ email }: { email: string }) {
  const router = useRouter();
  const ids = { label: useId(), password: useId(), hint: useId(), error: useId() };
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState(false);
  const [sentNote, setSentNote] = useState<string | null>(null);
  const save = useAuthStep();
  const resend = useRequestCode();
  const canSubmit = useCanSubmit();
  const check = checkPassword(password);
  const passwordError =
    save.error?.fieldErrors.password ??
    (touched && !check.ok ? PASSWORD_PROBLEM_COPY[check.problem] : undefined);

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(true);
    if (!check.ok || code.length !== OTP_LENGTH) return;
    const result = await save.run("password", {
      email,
      code,
      newPassword: password,
      flow: "reset-verification",
    });
    if (result.ok) router.replace(AFTER_SIGN_IN_PATH);
  }

  return (
    <div className="flex flex-col gap-6">
      <AuthHeading title="Choose a new password">
        If <strong className="text-text">{email}</strong> has a world, a code is on its way. It
        works for {OTP_MINUTES} minutes.
      </AuthHeading>
      <form
        noValidate
        onSubmit={(event) => void handleSubmit(event)}
        className="flex flex-col gap-4"
      >
        <FormAlert
          message={save.error && !save.error.fieldErrors.password ? save.error.message : null}
        />
        <Field>
          <Label id={ids.label}>Your code</Label>
          <OtpInput length={OTP_LENGTH} value={code} onChange={setCode} labelledBy={ids.label} />
        </Field>
        <Field>
          <Label htmlFor={ids.password}>New password</Label>
          <PasswordInput
            id={ids.password}
            autoComplete="new-password"
            minLength={PASSWORD_MIN_LENGTH}
            value={password}
            aria-invalid={passwordError !== undefined || undefined}
            aria-describedby={`${ids.hint} ${ids.error}`}
            onChange={(event) => {
              setPassword(event.target.value);
            }}
          />
          <FieldHint id={ids.hint}>At least {PASSWORD_MIN_LENGTH} characters.</FieldHint>
          <FieldError id={ids.error}>{passwordError}</FieldError>
        </Field>
        <Button
          type="submit"
          size="lg"
          pending={save.pending}
          disabled={!canSubmit}
          className="w-full"
        >
          Save and sign in
        </Button>
        <OfflineHint />
      </form>
      <div className="flex flex-col items-center gap-2 text-sm">
        <p role="status" aria-live="polite" className="text-text-muted">
          {sentNote}
        </p>
        <Button
          variant="ghost"
          size="sm"
          pending={resend.pending}
          disabled={!canSubmit || resend.secondsLeft > 0}
          onClick={() => {
            setSentNote(null);
            void resend.request(email).then((sent) => {
              if (sent) setSentNote("A fresh code is on its way.");
            });
          }}
        >
          {resend.secondsLeft > 0
            ? `Send a new code in ${String(resend.secondsLeft)}s`
            : "Send a new code"}
        </Button>
      </div>
    </div>
  );
}
