"use client";

import { CircleAlert, Eye, EyeOff } from "lucide-react";
import { type ComponentProps, type ReactNode, useState } from "react";

import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { useOnlineStatus } from "@/hooks/use-online-status";

export function AuthHeading({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <header className="flex flex-col gap-2 sm:text-center">
      <h1 className="wl-h2 text-text sm:wl-h3">{title}</h1>
      {children === undefined ? null : <p className="wl-body text-text-muted">{children}</p>}
    </header>
  );
}

/** The form-level message. Always mounted, so screen readers hear it when it changes. */
export function FormAlert({ message }: { message: string | null }) {
  return (
    <div role="alert" aria-live="assertive" className="empty:hidden">
      {message === null ? null : (
        <p className="flex items-start gap-2 rounded-md border border-danger bg-danger-surface px-4 py-3 wl-small text-text">
          <CircleAlert aria-hidden className="mt-0.5 size-5 shrink-0 text-danger" />
          <span>{message}</span>
        </p>
      )}
    </div>
  );
}

/** Explains why submit is off while offline. */
export function OfflineHint() {
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <p role="status" className="text-center wl-small text-warning">
      You&apos;re offline. We&apos;ll be ready when your connection is back.
    </p>
  );
}

export function useCanSubmit(): boolean {
  return useOnlineStatus();
}

export function PasswordInput(props: Omit<ComponentProps<typeof Input>, "type">) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input {...props} type={visible ? "text" : "password"} className="pr-14" />
      <IconButton
        label={visible ? "Hide password" : "Show password"}
        icon={visible ? <EyeOff /> : <Eye />}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0"
        onClick={() => {
          setVisible((current) => !current);
        }}
      />
    </div>
  );
}

export function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 wl-small text-text-muted">
      <span aria-hidden className="h-px flex-1 bg-line" />
      {label}
      <span aria-hidden className="h-px flex-1 bg-line" />
    </div>
  );
}
