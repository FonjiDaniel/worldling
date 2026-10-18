"use client";

import { type ClipboardEvent, type KeyboardEvent, useRef } from "react";

import { cn } from "@/lib/utils";

interface OtpInputProps {
  length: number;
  value: string;
  onChange: (value: string) => void;
  /** Called once every cell is filled, e.g. to submit. */
  onComplete?: (value: string) => void;
  labelledBy: string;
  describedBy?: string;
  invalid?: boolean;
  disabled?: boolean;
}

const digitsOf = (text: string) => text.replace(/\D/g, "");

/**
 * One cell per digit. Typing advances, Backspace steps back, arrows move, and pasting a whole
 * code into any cell fills them all. The first cell offers `one-time-code` autofill.
 */
export function OtpInput({
  length,
  value,
  onChange,
  onComplete,
  labelledBy,
  describedBy,
  invalid = false,
  disabled = false,
}: OtpInputProps) {
  const cells = useRef<(HTMLInputElement | null)[]>([]);
  const focusCell = (index: number) => {
    const target = cells.current[Math.max(0, Math.min(length - 1, index))];
    target?.focus();
    target?.select();
  };

  function update(next: string, focusIndex: number) {
    const clean = digitsOf(next).slice(0, length);
    onChange(clean);
    focusCell(focusIndex);
    if (clean.length === length) onComplete?.(clean);
  }

  function handleInput(index: number, raw: string) {
    const typed = digitsOf(raw);
    if (typed === "") return;
    // Autofill and some keyboards put the whole code into one cell.
    if (typed.length > 1) {
      update(value.slice(0, index) + typed, index + typed.length);
      return;
    }
    const chars = value.padEnd(length, " ").split("");
    chars[index] = typed;
    update(chars.join("").replace(/ /g, ""), index + 1);
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace") {
      event.preventDefault();
      if (value[index] !== undefined) {
        update(value.slice(0, index) + value.slice(index + 1), index);
      } else {
        update(value.slice(0, index - 1) + value.slice(index), index - 1);
      }
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusCell(index - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      focusCell(Math.min(index + 1, value.length));
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    const pasted = digitsOf(event.clipboardData.getData("text"));
    if (pasted === "") return;
    event.preventDefault();
    update(pasted, pasted.length);
  }

  return (
    <div
      role="group"
      aria-labelledby={labelledBy}
      className="flex justify-between gap-1.5 sm:gap-2"
    >
      {Array.from({ length }, (_, index) => (
        <input
          key={index}
          ref={(node) => {
            cells.current[index] = node;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={index === 0 ? length : 1}
          aria-label={`Digit ${String(index + 1)} of ${String(length)}`}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          disabled={disabled}
          value={value[index] ?? ""}
          onChange={(event) => {
            handleInput(index, event.target.value);
          }}
          onKeyDown={(event) => {
            handleKeyDown(index, event);
          }}
          onPaste={handlePaste}
          onFocus={(event) => {
            event.target.select();
          }}
          className={cn(
            "h-control w-full min-w-0 rounded-sm bg-void text-center font-mono text-h4 text-text tabular-nums border-control",
            "transition-colors duration-fast ease-out hover:border-text-muted focus-visible:border-accent",
            "disabled:opacity-50 aria-invalid:border-danger",
          )}
        />
      ))}
    </div>
  );
}
