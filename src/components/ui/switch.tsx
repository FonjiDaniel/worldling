"use client";

import { Switch as SwitchPrimitive } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/** An on/off control. Pair it with a visible <label htmlFor> or pass aria-label. */
export function Switch({ className, ...props }: ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full bg-surface-raised border-control",
        "transition-colors duration-fast ease-out data-[state=checked]:border-accent data-[state=checked]:bg-accent",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "block size-5 translate-x-1 rounded-full bg-text shadow-panel",
          "transition-transform duration-fast ease-out data-[state=checked]:translate-x-6 data-[state=checked]:bg-void",
          "motion-reduce:transition-none",
        )}
      />
    </SwitchPrimitive.Root>
  );
}
