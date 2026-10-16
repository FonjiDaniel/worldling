import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export const controlClasses = [
  "w-full rounded-md border border-control-line bg-surface px-3 text-base text-text",
  "placeholder:text-text-muted transition-colors duration-fast ease-out",
  "hover:border-text-muted focus-visible:border-accent",
  "aria-invalid:border-danger disabled:cursor-not-allowed disabled:opacity-50",
];

export function Input({ className, type = "text", ...props }: ComponentProps<"input">) {
  return <input type={type} className={cn(controlClasses, "h-touch", className)} {...props} />;
}
