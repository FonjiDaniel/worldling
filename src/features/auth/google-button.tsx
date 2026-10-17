"use client";

import { Button } from "@/components/ui/button";

import { useAuthStep } from "./use-auth-step";

function GoogleMark() {
  // Google's brand guidelines require the mark in its own colors (google-* tokens).
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-5">
      <path
        className="fill-google-blue"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.7Z"
      />
      <path
        className="fill-google-green"
        d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3a7.2 7.2 0 0 1-10.8-3.8h-4v3.1A12 12 0 0 0 12 24Z"
      />
      <path
        className="fill-google-yellow"
        d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1Z"
      />
      <path
        className="fill-google-red"
        d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1A7.2 7.2 0 0 1 12 4.8Z"
      />
    </svg>
  );
}

/** Sends the person to Google, then back to `next`. Convex Auth handles the callback. */
export function GoogleButton({
  next,
  onError,
}: {
  next: string;
  onError: (message: string) => void;
}) {
  const { run, pending } = useAuthStep();
  return (
    <Button
      variant="secondary"
      className="w-full"
      pending={pending}
      onClick={() => {
        void run("google", { redirectTo: next }).then((result) => {
          if (!result.ok) onError(result.error.message);
        });
      }}
    >
      {pending ? null : <GoogleMark />}
      Continue with Google
    </Button>
  );
}
