"use client";

import { useQuery } from "convex/react";
import { Check, LoaderCircle, X } from "lucide-react";
import { useId } from "react";

import { Field, FieldHint, Label } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { api } from "@convex/_generated/api";
import { checkUsername, normalizeUsername, USERNAME_PROBLEM_COPY } from "@convex/shared/usernames";

export const AVAILABILITY_DEBOUNCE_MS = 300;

export type UsernameState = "empty" | "checking" | "available" | "unavailable";

/** Checks the format locally at once, then asks the server (reserved, taken) after a pause. */
export function useUsernameAvailability(raw: string) {
  const username = normalizeUsername(raw);
  const local = checkUsername(username);
  const debounced = useDebouncedValue(username, AVAILABILITY_DEBOUNCE_MS);
  const settled = debounced === username;
  const remote = useQuery(
    api.profiles.isUsernameAvailable,
    local.ok && settled ? { username: debounced } : "skip",
  );

  if (username === "") return { username, state: "empty" as const, message: null };
  if (!local.ok) {
    return {
      username,
      state: "unavailable" as const,
      message: USERNAME_PROBLEM_COPY[local.reason],
    };
  }
  if (!settled || remote === undefined)
    return { username, state: "checking" as const, message: null };
  if (remote.available) {
    return { username, state: "available" as const, message: `${username} is yours to take.` };
  }
  return { username, state: "unavailable" as const, message: USERNAME_PROBLEM_COPY[remote.reason] };
}

type Availability = ReturnType<typeof useUsernameAvailability>;

interface UsernameFieldProps {
  value: string;
  onChange: (value: string) => void;
  availability: Availability;
  serverError?: string;
}

const ICONS = {
  checking: <LoaderCircle aria-hidden className="size-5 animate-spin text-text-muted" />,
  available: <Check aria-hidden className="size-5 text-success" />,
  unavailable: <X aria-hidden className="size-5 text-danger" />,
  empty: null,
};

export function UsernameField({ value, onChange, availability, serverError }: UsernameFieldProps) {
  const ids = { input: useId(), status: useId(), hint: useId() };
  const { username, state, message } = availability;
  const shown = serverError ?? message;
  const invalid = serverError !== undefined || state === "unavailable";

  return (
    <Field>
      <Label htmlFor={ids.input}>Username</Label>
      <div className="relative">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-text-muted"
        >
          @
        </span>
        <Input
          id={ids.input}
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          maxLength={20}
          value={value}
          aria-invalid={invalid || undefined}
          aria-describedby={`${ids.hint} ${ids.status}`}
          className="pr-10 pl-7"
          onChange={(event) => {
            onChange(event.target.value);
          }}
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
          {ICONS[state]}
        </span>
      </div>
      <FieldHint id={ids.hint}>
        Your world lives at{" "}
        <span className="font-mono text-text">/w/{username === "" ? "yourname" : username}</span>
      </FieldHint>
      <p
        id={ids.status}
        role="status"
        aria-live="polite"
        className={invalid ? "text-sm text-danger" : "text-sm text-success"}
      >
        {state === "checking" ? <span className="sr-only">Checking</span> : shown}
      </p>
    </Field>
  );
}
