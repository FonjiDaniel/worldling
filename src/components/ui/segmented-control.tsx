"use client";

import { ToggleGroup } from "radix-ui";
import { type ReactNode, useState } from "react";

import { cn } from "@/lib/utils";

export interface Segment<T extends string> {
  value: T;
  label: ReactNode;
}

interface SegmentedControlProps<T extends string> {
  label: string;
  segments: readonly Segment<T>[];
  value?: T;
  defaultValue?: T;
  onValueChange?: (value: T) => void;
  disabled?: boolean;
  className?: string;
}

export function SegmentedControl<T extends string>({
  label,
  segments,
  value,
  defaultValue,
  onValueChange,
  disabled,
  className,
}: SegmentedControlProps<T>) {
  const [inner, setInner] = useState(defaultValue ?? segments[0]?.value);
  const current = value ?? inner;

  function handleChange(next: string) {
    // A segmented control always has one choice. Ignore attempts to clear it.
    const segment = segments.find((item) => item.value === next);
    if (!segment) return;
    setInner(segment.value);
    onValueChange?.(segment.value);
  }

  return (
    <ToggleGroup.Root
      type="single"
      aria-label={label}
      value={current}
      onValueChange={handleChange}
      disabled={disabled}
      className={cn(
        "inline-flex rounded-full border border-control-line bg-surface p-0.5 data-disabled:opacity-50",
        className,
      )}
    >
      {segments.map((segment) => (
        <ToggleGroup.Item
          key={segment.value}
          value={segment.value}
          className={cn(
            "min-h-touch rounded-full px-4 text-sm font-medium text-text-muted transition-colors duration-fast ease-out",
            "hover:text-text data-[state=on]:bg-primary data-[state=on]:text-on-primary",
          )}
        >
          {segment.label}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}
