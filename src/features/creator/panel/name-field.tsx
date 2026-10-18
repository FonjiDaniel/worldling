"use client";

import { useId } from "react";

import { countGraphemes } from "@convex/shared/graphemes";
import { WORLD_NAME_MAX } from "@convex/shared/worldParams";

import { Field, FieldError, FieldHint, Label } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { worldNameProblem } from "../names";
import { useCreator, useCreatorStore } from "../store";

export const NAME_INPUT_ID = "creator-world-name";

/** The world's name. Typing previews live; leaving the field makes it one undo step. */
export function NameField({ showProblem }: { showProblem: boolean }) {
  const store = useCreatorStore();
  const name = useCreator((state) => state.history.present.name);
  const ids = { hint: useId(), error: useId() };
  const count = countGraphemes(name.trim());
  const problem = worldNameProblem(name);
  const shown = showProblem || count > WORLD_NAME_MAX ? problem : null;

  return (
    <Field>
      <Label htmlFor={NAME_INPUT_ID}>World name</Label>
      <Input
        id={NAME_INPUT_ID}
        value={name}
        autoComplete="off"
        aria-invalid={shown !== null || undefined}
        aria-describedby={`${ids.hint} ${ids.error}`}
        onChange={(event) => {
          const state = store.getState();
          state.preview({ ...state.history.present, name: event.target.value, nameEdited: true });
        }}
        onBlur={() => {
          store.getState().commit("name change");
        }}
      />
      <div className="flex justify-between gap-3">
        <FieldHint id={ids.hint}>Shown on your world and in the universe.</FieldHint>
        <span
          aria-hidden
          className={
            count > WORLD_NAME_MAX ? "wl-timestamp text-danger" : "wl-timestamp text-text-muted"
          }
        >
          {count}/{WORLD_NAME_MAX}
        </span>
      </div>
      <FieldError id={ids.error}>{shown}</FieldError>
    </Field>
  );
}
