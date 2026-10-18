import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 wl-caption rounded-full border px-2.5 py-0.5 [&_svg]:size-4",
  {
    variants: {
      tone: {
        neutral: "border-control-line bg-surface-raised text-text",
        primary: "border-transparent bg-primary text-on-primary",
        accent: "border-transparent bg-accent text-on-accent",
        success: "border-success bg-success-surface text-success",
        warning: "border-warning bg-warning-surface text-warning",
        danger: "border-danger bg-danger-surface text-danger",
        info: "border-info bg-info-surface text-info",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export type BadgeProps = ComponentProps<"span"> & VariantProps<typeof badgeVariants>;

/** Status tones need an icon or wording too: color is never the only signal. */
export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
