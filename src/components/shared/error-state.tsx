import { CircleAlert } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  /** What happened and what to do next, in one or two sentences. */
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  action?: ReactNode;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't finish that. Try again in a moment.",
  onRetry,
  retryLabel = "Try again",
  action,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center gap-3 rounded-lg border border-danger bg-danger-surface px-6 py-10 text-center",
        className,
      )}
    >
      <CircleAlert aria-hidden className="size-8 text-danger" />
      <h2 className="wl-h4 text-text">{title}</h2>
      <p className="max-w-prose wl-body text-text">{description}</p>
      {onRetry || action ? (
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          {onRetry ? (
            <Button variant="secondary" onClick={onRetry}>
              {retryLabel}
            </Button>
          ) : null}
          {action}
        </div>
      ) : null}
    </div>
  );
}
