"use client";

import { ErrorState } from "./error-state";
import { MAIN_ID } from "./skip-link";

export interface RouteErrorProps {
  error: unknown;
  retry: () => void;
}

/** Shared body for every error.tsx. Never shows the raw message (it may hold internals). */
export function RouteError({ retry }: RouteErrorProps) {
  return (
    <main
      id={MAIN_ID}
      tabIndex={-1}
      className="mx-auto flex w-full max-w-panel flex-1 items-center px-4 py-16"
    >
      <ErrorState
        className="w-full"
        title="This page lost its orbit"
        description="Something went wrong on our side. Try again, and if it keeps happening, come back in a little while."
        onRetry={retry}
      />
    </main>
  );
}
