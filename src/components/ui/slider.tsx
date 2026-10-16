"use client";

import { Slider as SliderPrimitive } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

type SliderProps = ComponentProps<typeof SliderPrimitive.Root> & {
  /** Accessible name for the thumb, for example "Ocean level". */
  label: string;
  /** Spoken value, for example "40 percent". */
  valueText?: (value: number) => string;
};

export function Slider({
  className,
  label,
  valueText,
  value,
  defaultValue,
  ...props
}: SliderProps) {
  const current = (value ?? defaultValue ?? [0])[0] ?? 0;
  return (
    <SliderPrimitive.Root
      className={cn(
        "relative flex h-touch w-full touch-none items-center select-none data-disabled:opacity-50",
        className,
      )}
      value={value}
      defaultValue={defaultValue}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1.5 grow overflow-hidden rounded-full bg-control-line">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        aria-label={label}
        aria-valuetext={valueText?.(current)}
        className="block size-5 rounded-full border-2 border-void bg-text shadow-raised transition-transform duration-fast ease-out hover:scale-110"
      />
    </SliderPrimitive.Root>
  );
}
