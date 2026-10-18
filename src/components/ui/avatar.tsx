"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { Avatar as AvatarPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

const avatarVariants = cva(
  "relative inline-flex shrink-0 overflow-hidden rounded-full border border-line bg-surface-raised",
  {
    variants: {
      size: { sm: "size-8 text-caption", md: "size-10 text-small", lg: "size-16 text-h4" },
    },
    defaultVariants: { size: "md" },
  },
);

type AvatarProps = VariantProps<typeof avatarVariants> & {
  name: string;
  src?: string;
  className?: string;
};

export function Avatar({ name, src, size, className }: AvatarProps) {
  return (
    <AvatarPrimitive.Root className={cn(avatarVariants({ size }), className)}>
      {src ? (
        <AvatarPrimitive.Image src={src} alt={name} className="size-full object-cover" />
      ) : null}
      <AvatarPrimitive.Fallback
        className="grid size-full place-items-center bg-nebula-900 font-medium text-text"
        aria-label={name}
        role="img"
      >
        <span aria-hidden>{initials(name)}</span>
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}
