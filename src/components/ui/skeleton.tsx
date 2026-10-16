import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/** Decorative placeholder. Pair with a "Loading" status for screen readers (see LoadingState). */
export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      aria-hidden
      className={cn("rounded-md bg-surface-raised motion-safe:animate-shimmer", className)}
      {...props}
    />
  );
}
