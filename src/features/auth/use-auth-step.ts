"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useEffect, useState } from "react";

import { type AuthError, toAuthError } from "./errors";

type Params = Record<string, string>;

/** Whether Convex Auth signed the person in, or is waiting for a code. */
export type StepResult = { ok: true; signedIn: boolean } | { ok: false; error: AuthError };

/** One call to Convex Auth's signIn, with pending state and friendly errors. Never throws. */
export function useAuthStep() {
  const { signIn } = useAuthActions();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);

  async function run(provider: string, params: Params): Promise<StepResult> {
    setPending(true);
    setError(null);
    try {
      const { signingIn } = await signIn(provider, params);
      return { ok: true, signedIn: signingIn };
    } catch (thrown) {
      const authError = toAuthError(thrown);
      setError(authError);
      return { ok: false, error: authError };
    } finally {
      setPending(false);
    }
  }

  return { run, pending, error, setError };
}

/** Seconds left on a countdown that starts whenever `start(ms)` is called. */
export function useCountdown() {
  const [until, setUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (until <= now) return;
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => {
      window.clearInterval(timer);
    };
  }, [until, now]);

  const secondsLeft = Math.max(0, Math.ceil((until - now) / 1000));
  return {
    secondsLeft,
    start: (ms: number) => {
      setNow(Date.now());
      setUntil(Date.now() + ms);
    },
  };
}
