import { cva, type VariantProps } from "class-variance-authority";
import { LoaderCircle } from "lucide-react";
import { Slot } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  [
    "inline-flex min-h-touch shrink-0 items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap select-none",
    "transition-[background-color,color,border-color,transform] duration-fast ease-out",
    "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 aria-busy:cursor-progress",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        primary: "bg-warm text-on-warm hover:bg-warm-hover active:bg-warm-active",
        secondary:
          "border border-control-line bg-glass text-text backdrop-blur-glass hover:bg-surface-raised",
        ghost: "text-text hover:bg-surface-raised",
        danger: "bg-danger text-on-danger hover:brightness-110",
      },
      size: {
        sm: "px-4 text-sm",
        md: "px-5 text-base",
        lg: "px-7 text-lg",
        icon: "size-touch",
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
