"use client";

import { type ChangeEvent, type ComponentProps, useId, useState } from "react";

import { countGraphemes } from "@convex/shared/graphemes";

import { cn } from "@/lib/utils";

import { controlClasses } from "./input";

// Announce the count only when it matters, not on every keystroke.
const ANNOUNCE_WHEN_REMAINING = 20;

type TextareaProps = ComponentProps<"textarea"> & {
  /** Limit in user-perceived characters. Shows a counter when set. */
  maxGraphemes?: number;
};

export function Textarea({
  className,
  maxGraphemes,
  value,
  defaultValue,
  onChange,
  "aria-describedby": describedBy,
  ...props
}: TextareaProps) {
  const counterId = useId();
  const [inner, setInner] = useState(() => toText(defaultValue));
  const text = value === undefined ? inner : toText(value);
  const count = countGraphemes(text);
  const over = maxGraphemes !== undefined && count > maxGraphemes;

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setInner(event.target.value);
    onChange?.(event);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <textarea
        className={cn(controlClasses, "min-h-24 resize-y py-2.5", className)}
        value={value}
        defaultValue={defaultValue}
        onChange={handleChange}
        aria-invalid={over || props["aria-invalid"]}
        aria-describedby={
          maxGraphemes === undefined ? describedBy : cn(describedBy, counterId) || undefined
        }
        {...props}
      />
      {maxGraphemes === undefined ? null : (
        <Counter id={counterId} count={count} max={maxGraphemes} />
      )}
    </div>
  );
}

function Counter({ id, count, max }: { id: string; count: number; max: number }) {
  const remaining = max - count;
  const announce = remaining <= ANNOUNCE_WHEN_REMAINING;
  const message =
    remaining >= 0
      ? `${remaining} characters left`
      : `${Math.abs(remaining)} characters over the limit`;
  return (
    <>
      <p
        id={id}
        className={cn(
          "self-end font-mono text-xs tabular-nums",
          remaining < 0 ? "text-danger" : "text-text-muted",
        )}
      >
        {count} / {max}
        <span className="sr-only">. {message}</span>
      </p>
      <p className="sr-only" aria-live="polite">
        {announce ? message : ""}
      </p>
    </>
  );
}

function toText(value: TextareaProps["value"]): string {
  if (value === undefined) return "";
  return Array.isArray(value) ? value.join("") : String(value);
}
