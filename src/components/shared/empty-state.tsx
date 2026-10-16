import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-lg border border-dashed border-line px-6 py-10 text-center",
        className,
      )}
    >
      <span
        aria-hidden
        className="grid size-12 place-items-center rounded-full bg-nebula-950 text-link [&_svg]:size-6"
      >
        {icon ?? <Sparkles />}
      </span>
      <h2 className="text-xl font-semibold text-text">{title}</h2>
      {description ? <p className="max-w-prose text-text-muted">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
