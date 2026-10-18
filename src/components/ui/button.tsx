import { cva, type VariantProps } from "class-variance-authority";
import { LoaderCircle } from "lucide-react";
import { Slot } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  [
    "pressable wl-button inline-flex min-h-touch shrink-0 items-center justify-center gap-2 rounded-full text-center select-none",
    "disabled:pointer-events-none disabled:opacity-50 aria-busy:cursor-progress",
    "[&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        primary: "bg-warm text-on-warm hover:bg-warm-hover active:bg-warm-active",
        secondary: "glass border-control text-text hover:bg-surface-raised",
        ghost: "text-text hover:bg-surface-raised active:bg-surface-raised",
        danger: "bg-danger text-on-danger hover:bg-danger/90",
      },
      size: {
        sm: "px-4 py-2 text-label",
        md: "min-h-control px-6 py-3",
        lg: "min-h-control px-8 py-3 text-body-lg font-semibold",
        icon: "size-touch rounded-sm",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    pending?: boolean;
  };

export function Button({
  className,
  variant,
  size,
  asChild = false,
  pending = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  if (asChild) {
    return (
      <Slot.Root className={cn(buttonVariants({ variant, size }), className)} {...props}>
        {children}
      </Slot.Root>
    );
  }
  return (
    <button
      type="button"
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled === true || pending}
      aria-busy={pending || undefined}
      {...props}
    >
      {pending ? <LoaderCircle aria-hidden className="animate-spin" /> : null}
      {children}
    </button>
  );
}
