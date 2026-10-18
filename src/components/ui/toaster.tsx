"use client";

import { Toaster as Sonner } from "sonner";

export { toast } from "sonner";

export function Toaster() {
  return (
    <Sonner
      theme="dark"
      position="bottom-center"
      closeButton
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex w-full items-start gap-3 rounded-md border border-line bg-surface-raised p-4 text-text shadow-panel",
          title: "wl-label",
          description: "wl-small text-text-muted",
          icon: "mt-0.5 [&_svg]:size-5",
          success: "[&_[data-icon]]:text-success",
          error: "border-danger [&_[data-icon]]:text-danger",
          warning: "[&_[data-icon]]:text-warning",
          info: "[&_[data-icon]]:text-info",
          actionButton:
            "pressable wl-label ml-auto min-h-touch rounded-full bg-warm px-4 text-on-warm hover:bg-warm-hover",
          cancelButton: "wl-label min-h-touch rounded-full px-4 text-text-muted hover:text-text",
          closeButton:
            "absolute -top-2 -left-2 grid size-6 place-items-center rounded-full border border-control-line bg-surface text-text",
        },
      }}
    />
  );
}
