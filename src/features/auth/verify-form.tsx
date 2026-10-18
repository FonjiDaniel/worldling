"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type SyntheticEvent, useId, useMemo, useState, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldHint, Label } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { OTP_LENGTH, OTP_MINUTES } from "@convex/shared/otp";

import {
  clearPendingFlow,
  normalizeEmail,
  parsePendingFlow,
  pendingFlowSnapshot,
} from "./flow-state";
import { AuthHeading, FormAlert, OfflineHint, useCanSubmit } from "./form-parts";
import { OtpInput } from "./otp-input";
import { safeNextPath } from "./routes";
import { useAuthStep, useCountdown } from "./use-auth-step";

const RESEND_COOLDOWN_MS = 30_000;
const noSubscribe = () => () => undefined;

export function VerifyForm() {
  const router = useRouter();
  // Read once on the client; the server render has no session storage.
  const raw = useSyncExternalStore(noSubscribe, pendingFlowSnapshot, () => null);
  const pending = useMemo(() => parsePendingFlow(raw), [raw]);
  const ids = { email: useId(), label: useId(), hint: useId() };
  const [typedEmail, setTypedEmail] = useState("");
  const [code, setCode] = useState("");
  const [sentNote, setSentNote] = useState<string | null>(null);
  const verify = useAuthStep();
  const resend = useAuthStep();
  const cooldown = useCountdown();
  const canSubmit = useCanSubmit();
  const email = pending?.email ?? normalizeEmail(typedEmail);

  async function submit(value: string) {
    if (value.length !== OTP_LENGTH || email === "" || verify.pending) return;
    const result = await verify.run("password", { email, code: value, flow: "email-verification" });
    if (!result.ok) {
      setCode("");
      return;
    }
    clearPendingFlow();
    router.replace(safeNextPath(pending?.next));
  }

  async function handleResend() {
    setSentNote(null);
    const result = await resend.run("password", { email, flow: "email-verification" });
    if (result.ok) {
      setSentNote("A fresh code is on its way.");
      cooldown.start(RESEND_COOLDOWN_MS);
    } else if (result.error.retryAfterMs !== undefined) {
      cooldown.start(result.error.retryAfterMs);
    }
  }

  function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    void submit(code);
  }

  const error = verify.error ?? resend.error;
  return (
    <div className="flex flex-col gap-6">
      <AuthHeading title="Check your email">
        {pending === null ? (
          <>
            We sent an {OTP_LENGTH} digit code. It works for {OTP_MINUTES} minutes.
          </>
        ) : (
          <>
            We sent an {OTP_LENGTH} digit code to{" "}
            <strong className="text-text">{pending.email}</strong>. It works for {OTP_MINUTES}{" "}
            minutes.
          </>
        )}
      </AuthHeading>
      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormAlert message={error?.message ?? null} />
        {pending === null ? (
          <Field>
            <Label htmlFor={ids.email}>Email</Label>
            <Input
              id={ids.email}
              type="email"
              autoComplete="email"
              value={typedEmail}
              onChange={(event) => {
                setTypedEmail(event.target.value);
              }}
            />
          </Field>
        ) : null}
        <Field>
          <Label id={ids.label}>Your code</Label>
          <OtpInput
            length={OTP_LENGTH}
            value={code}
            onChange={setCode}
            onComplete={(value) => void submit(value)}
            labelledBy={ids.label}
            describedBy={ids.hint}
            invalid={verify.error?.fieldErrors.code !== undefined}
            disabled={verify.pending}
          />
          <FieldHint id={ids.hint}>You can paste the whole code into any box.</FieldHint>
          <FieldError>
            {verify.error?.fieldErrors.code === undefined ? null : "Try that code again."}
          </FieldError>
        </Field>
        <Button
          type="submit"
          size="lg"
          pending={verify.pending}
          disabled={!canSubmit || code.length !== OTP_LENGTH}
          className="w-full"
        >
          Verify and continue
        </Button>
        <OfflineHint />
      </form>
      <div className="flex flex-col items-center gap-2 wl-small text-text-muted">
        <p role="status" aria-live="polite">
          {sentNote}
        </p>
        <Button
          variant="ghost"
          size="sm"
          pending={resend.pending}
          disabled={!canSubmit || email === "" || cooldown.secondsLeft > 0}
          onClick={() => void handleResend()}
        >
          {cooldown.secondsLeft > 0
            ? `Send a new code in ${String(cooldown.secondsLeft)}s`
            : "Send a new code"}
        </Button>
        <Link href="/sign-up" className="text-link underline-offset-4 hover:underline">
          Use a different email
        </Link>
      </div>
    </div>
  );
}
