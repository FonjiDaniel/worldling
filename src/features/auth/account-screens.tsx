"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { MoonStar, Wrench } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";

import { Button } from "@/components/ui/button";
import { env } from "@/lib/env";

function CalmScreen({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mx-auto flex w-full max-w-panel flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <span
        aria-hidden
        className="flex size-14 items-center justify-center rounded-full bg-surface-raised text-accent [&_svg]:size-8"
      >
        {icon}
      </span>
      <h1 className="wl-h2">{title}</h1>
      {children}
    </section>
  );
}

export function useSignOut() {
  const { signOut } = useAuthActions();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  return {
    pending,
    signOut: async () => {
      setPending(true);
      try {
        await signOut();
        router.replace("/");
      } finally {
        setPending(false);
      }
    },
  };
}

export function SuspendedScreen({ reason }: { reason: string | null }) {
  const { signOut, pending } = useSignOut();
  const support = env.NEXT_PUBLIC_SUPPORT_EMAIL;
  return (
    <CalmScreen icon={<MoonStar />} title="Your world is resting">
      <p className="max-w-prose wl-body text-text-muted">
        Your account is paused, so you can&apos;t visit or send comets for now.
      </p>
      {reason === null ? null : (
        <p className="max-w-prose rounded-md border border-line bg-surface px-4 py-3 wl-body text-text shadow-panel">
          <span className="block wl-label text-text-muted">The reason we gave</span>
          {reason}
        </p>
      )}
      <p className="max-w-prose wl-body text-text-muted">
        {support === undefined ? (
          "If you think this is a mistake, reply to the email we sent you and tell us what happened."
        ) : (
          <>
            If you think this is a mistake, write to{" "}
            <a
              href={`mailto:${support}?subject=Appeal`}
              className="text-link underline underline-offset-4"
            >
              {support}
            </a>{" "}
            and tell us what happened.
          </>
        )}
      </p>
      <Button variant="secondary" pending={pending} onClick={() => void signOut()}>
        Sign out
      </Button>
    </CalmScreen>
  );
}

export function MaintenanceScreen({ message }: { message: string }) {
  return (
    <CalmScreen icon={<Wrench />} title="We're tending the universe">
      <p className="max-w-prose wl-body text-text-muted">
        {message === "" ? "Worldling is getting a little care. Please check back soon." : message}
      </p>
      <p role="status" className="wl-small text-text-muted">
        This page comes back on its own when we&apos;re done.
      </p>
    </CalmScreen>
  );
}
