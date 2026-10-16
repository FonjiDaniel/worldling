"use client";

import { ErrorState } from "@/components/shared/error-state";
import type { RouteErrorProps } from "@/components/shared/route-error";
import { fontVariables } from "@/styles/fonts";

import "@/styles/globals.css";

// Replaces the root layout when it fails, so it brings its own document, styles and fonts.
export default function GlobalError({ retry }: RouteErrorProps) {
  return (
    <html lang="en" className={`${fontVariables} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <title>Something went wrong | Worldling</title>
        <main className="mx-auto flex w-full max-w-panel flex-1 items-center px-4 py-16">
          <ErrorState
            className="w-full"
            title="Worldling hit a snag"
            description="Something went wrong while loading. Try again, and if it keeps happening, come back in a little while."
            onRetry={retry}
          />
        </main>
      </body>
    </html>
  );
}
