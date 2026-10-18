import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export const controlClasses = [
  "wl-input border-control w-full rounded-md bg-void px-4 text-text",
  "placeholder:text-text-muted transition-colors duration-fast ease-out",
  "hover:border-text-muted focus-visible:border-accent",
  "aria-invalid:border-danger disabled:cursor-not-allowed disabled:opacity-50",
];

export function Input({ className, type = "text", ...props }: ComponentProps<"input">) {
  return (
    <input type={type} className={cn(controlClasses, "min-h-control py-3", className)} {...props} />
  );
}
