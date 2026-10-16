import type { ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";

interface LoadingStateProps {
  /** Spoken to screen readers while the skeleton shows. */
  label?: string;
  children?: ReactNode;
}

export function LoadingState({ label = "Loading", children }: LoadingStateProps) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-3">
      <span className="sr-only">{label}</span>
      {children ?? (
        <>
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </>
      )}
    </div>
  );
}
