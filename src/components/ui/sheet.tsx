"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import { Dialog as SheetPrimitive } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

import { DialogOverlay } from "./dialog";
import { IconButton } from "./icon-button";

export const Sheet = SheetPrimitive.Root;
export const SheetTrigger = SheetPrimitive.Trigger;
export const SheetClose = SheetPrimitive.Close;

const sheetVariants = cva(
  "fixed z-50 flex flex-col gap-4 border-line bg-surface p-panel-pad shadow-dialog focus-visible:outline-none md:p-panel-pad-lg",
  {
    variants: {
      side: {
        bottom:
          "inset-x-0 bottom-0 max-h-[85dvh] rounded-t-lg border-t data-[state=open]:animate-sheet-up data-[state=closed]:animate-sheet-down",
        right:
          "inset-y-0 right-0 w-full max-w-panel border-l data-[state=open]:animate-sheet-left data-[state=closed]:animate-sheet-right",
      },
    },
    defaultVariants: { side: "bottom" },
  },
);

type SheetContentProps = ComponentProps<typeof SheetPrimitive.Content> &
  VariantProps<typeof sheetVariants> & { closeLabel?: string };

export function SheetContent({
  side,
  className,
  children,
  closeLabel = "Close",
  ...props
}: SheetContentProps) {
  return (
    <SheetPrimitive.Portal>
      <DialogOverlay />
      <SheetPrimitive.Content className={cn(sheetVariants({ side }), className)} {...props}>
        {side !== "right" ? (
          <div aria-hidden className="mx-auto -mt-2 h-1 w-10 rounded-full bg-control-line" />
        ) : null}
        {children}
        <SheetPrimitive.Close asChild>
          <IconButton label={closeLabel} icon={<X />} className="absolute top-2 right-2" />
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  );
}

export function SheetTitle({ className, ...props }: ComponentProps<typeof SheetPrimitive.Title>) {
  return <SheetPrimitive.Title className={cn("pr-10 wl-h4 text-text", className)} {...props} />;
}

export function SheetDescription({
  className,
  ...props
}: ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description className={cn("wl-body text-text-muted", className)} {...props} />
  );
}
