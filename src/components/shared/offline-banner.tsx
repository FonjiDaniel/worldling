"use client";

import { WifiOff } from "lucide-react";

import { useOnlineStatus } from "@/hooks/use-online-status";

export function OfflineBanner() {
  const online = useOnlineStatus();
  return (
    <div role="status" aria-live="polite">
      {online ? null : <OfflineNotice />}
    </div>
  );
}

export function OfflineNotice() {
  return (
    <p className="flex items-center justify-center gap-2 border-b border-warning bg-warning-surface px-4 py-2 text-center text-sm text-warning">
      <WifiOff aria-hidden className="size-4 shrink-0" />
      You&apos;re offline. Your world is safe, and actions will work again once you reconnect.
    </p>
  );
}
