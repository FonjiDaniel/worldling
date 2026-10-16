import { Label as LabelPrimitive } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export function Label({ className, ...props }: ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      className={cn("text-sm font-medium text-text select-none", className)}
      {...props}
    />
  );
}

export function FieldHint({ className, ...props }: ComponentProps<"p">) {
  return <p className={cn("text-sm text-text-muted", className)} {...props} />;
}

export function FieldError({ className, children, ...props }: ComponentProps<"p">) {
  if (children === undefined || children === null || children === "") return null;
  return (
    <p className={cn("text-sm text-danger", className)} {...props}>
      {children}
    </p>
  );
}

export function Field({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1.5", className)} {...props} />;
}
