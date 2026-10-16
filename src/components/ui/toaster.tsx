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
            "flex w-full items-start gap-3 rounded-md border border-line bg-surface-raised p-4 text-text shadow-raised",
          title: "text-sm font-medium",
          description: "text-sm text-text-muted",
          icon: "mt-0.5 [&_svg]:size-4",
          success: "[&_[data-icon]]:text-success",
          error: "border-danger [&_[data-icon]]:text-danger",
          warning: "[&_[data-icon]]:text-warning",
          info: "[&_[data-icon]]:text-info",
          actionButton:
            "ml-auto min-h-touch rounded-full bg-warm px-4 text-sm font-medium text-on-warm",
          cancelButton: "min-h-touch rounded-full px-4 text-sm text-text-muted hover:text-text",
          closeButton:
            "absolute -top-2 -left-2 grid size-6 place-items-center rounded-full border border-control-line bg-surface text-text",
        },
      }}
    />
  );
}
