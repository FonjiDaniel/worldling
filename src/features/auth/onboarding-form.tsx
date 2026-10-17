"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { type SyntheticEvent, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldHint, Label } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAppMutation } from "@/hooks/use-app-mutation";
import { api } from "@convex/_generated/api";
import { countGraphemes } from "@convex/shared/graphemes";
import {
  DISPLAY_NAME_MAX,
  DISPLAY_NAME_PROBLEM_COPY,
  type DisplayNameProblem,
  USERNAME_PROBLEM_COPY,
  type UsernameProblem,
} from "@convex/shared/usernames";

import { AuthHeading, FormAlert, OfflineHint, useCanSubmit } from "./form-parts";
import { safeNextPath } from "./routes";
import { UsernameField, useUsernameAvailability } from "./username-field";

function copyFor<K extends string>(table: Record<K, string>, problem: string | undefined) {
  return problem !== undefined && problem in table ? table[problem as K] : undefined;
}

/** Pick a username and display name; the world is born in the same step (SPEC §6.3). */
export function OnboardingForm() {
  const router = useRouter();
  const next = safeNextPath(useSearchParams().get("next"));
  const ids = { name: useId(), nameHint: useId(), nameError: useId() };
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const availability = useUsernameAvailability(username);
  const { run, isPending, error, fieldErrors } = useAppMutation(api.profiles.completeOnboarding);
  const canSubmit = useCanSubmit();

  const usernameError = copyFor<UsernameProblem | "taken">(
    USERNAME_PROBLEM_COPY,
    fieldErrors.username?.[0],
  );
  const nameError = copyFor<DisplayNameProblem>(
    DISPLAY_NAME_PROBLEM_COPY,
    fieldErrors.displayName?.[0],
  );
  const nameCount = countGraphemes(displayName.trim());

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (availability.state !== "available" || displayName.trim() === "") return;
    // Draft claiming from /create arrives in Phase 6; without one the world starts from a random preset.
    const result = await run({ username: availability.username, displayName });
    if (result.ok) router.replace(next);
  }

  const formMessage =
    error === null || usernameError !== undefined || nameError !== undefined ? null : error.message;

  return (
    <div className="flex flex-col gap-6">
      <AuthHeading title="Name your corner of space">
        Pick how others find you. Your world appears the moment you finish.
      </AuthHeading>
      <form
        noValidate
        onSubmit={(event) => void handleSubmit(event)}
        className="flex flex-col gap-5"
      >
        <FormAlert message={formMessage} />
        <UsernameField
          value={username}
          onChange={setUsername}
          availability={availability}
          {...(usernameError !== undefined && { serverError: usernameError })}
        />
        <Field>
          <Label htmlFor={ids.name}>Display name</Label>
          <Input
            id={ids.name}
            autoComplete="nickname"
            value={displayName}
            aria-invalid={nameError !== undefined || nameCount > DISPLAY_NAME_MAX || undefined}
            aria-describedby={`${ids.nameHint} ${ids.nameError}`}
            onChange={(event) => {
              setDisplayName(event.target.value);
            }}
          />
          <div className="flex justify-between gap-3">
            <FieldHint id={ids.nameHint}>Shown on your world. You can change it later.</FieldHint>
            <span
              aria-hidden
              className={
                nameCount > DISPLAY_NAME_MAX ? "text-sm text-danger" : "text-sm text-text-muted"
              }
            >
              {nameCount}/{DISPLAY_NAME_MAX}
            </span>
          </div>
          <FieldError id={ids.nameError}>{nameError}</FieldError>
        </Field>
        <Button
          type="submit"
          size="lg"
          pending={isPending}
          disabled={
            !canSubmit ||
            availability.state !== "available" ||
            displayName.trim() === "" ||
            nameCount > DISPLAY_NAME_MAX
          }
          className="w-full"
        >
          Bring my world to life
        </Button>
        <OfflineHint />
      </form>
    </div>
  );
}
