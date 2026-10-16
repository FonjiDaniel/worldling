import { cn } from "@/lib/utils";

import { ShowcaseRow, ShowcaseSection } from "./showcase-section";

// Class names are literal so Tailwind can see them.
const semantic = [
  { name: "void", className: "bg-void" },
  { name: "surface", className: "bg-surface" },
  { name: "surface-raised", className: "bg-surface-raised" },
  { name: "glass", className: "bg-glass" },
  { name: "line", className: "bg-line" },
  { name: "control-line", className: "bg-control-line" },
  { name: "text", className: "bg-text" },
  { name: "text-muted", className: "bg-text-muted" },
  { name: "link", className: "bg-link" },
  { name: "primary", className: "bg-primary" },
  { name: "accent", className: "bg-accent" },
  { name: "warm", className: "bg-warm" },
  { name: "success", className: "bg-success" },
  { name: "warning", className: "bg-warning" },
  { name: "danger", className: "bg-danger" },
  { name: "info", className: "bg-info" },
] as const;

const scales = {
  nebula: [
    "bg-nebula-50",
    "bg-nebula-100",
    "bg-nebula-200",
    "bg-nebula-300",
    "bg-nebula-400",
    "bg-nebula-500",
    "bg-nebula-600",
    "bg-nebula-700",
    "bg-nebula-800",
    "bg-nebula-900",
    "bg-nebula-950",
  ],
  aurora: [
    "bg-aurora-50",
    "bg-aurora-100",
    "bg-aurora-200",
    "bg-aurora-300",
    "bg-aurora-400",
    "bg-aurora-500",
    "bg-aurora-600",
    "bg-aurora-700",
    "bg-aurora-800",
    "bg-aurora-900",
    "bg-aurora-950",
  ],
  sunrise: [
    "bg-sunrise-50",
    "bg-sunrise-100",
    "bg-sunrise-200",
    "bg-sunrise-300",
    "bg-sunrise-400",
    "bg-sunrise-500",
    "bg-sunrise-600",
    "bg-sunrise-700",
    "bg-sunrise-800",
    "bg-sunrise-900",
    "bg-sunrise-950",
  ],
} as const;

const typeScale = [
  { name: "display", className: "font-display text-display" },
  { name: "3xl", className: "font-display text-3xl" },
  { name: "2xl", className: "font-display text-2xl" },
  { name: "xl", className: "font-display text-xl" },
  { name: "lg", className: "text-lg" },
  { name: "base", className: "text-base" },
  { name: "sm", className: "text-sm" },
  { name: "mono", className: "font-mono text-sm" },
] as const;

export function TokensSection() {
  return (
    <ShowcaseSection
      id="tokens"
      title="Tokens"
      description="Brand colors (ADR-013), type and radius."
    >
      <ShowcaseRow label="Semantic colors">
        <ul className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {semantic.map((token) => (
            <li key={token.name} className="flex flex-col gap-1.5">
              <span
                aria-hidden
                className={cn("h-12 rounded-md border border-line", token.className)}
              />
              <span className="font-mono text-xs text-text-muted">{token.name}</span>
            </li>
          ))}
        </ul>
      </ShowcaseRow>
      {Object.entries(scales).map(([name, steps]) => (
        <ShowcaseRow key={name} label={`${name} 50 to 950`}>
          <div aria-hidden className="flex h-10 w-full overflow-hidden rounded-md">
            {steps.map((step) => (
              <span key={step} className={cn("flex-1", step)} />
            ))}
          </div>
        </ShowcaseRow>
      ))}
      <ShowcaseRow label="Gradient and radius">
        <span aria-hidden className="h-12 w-40 rounded-lg bg-gradient-brand" />
        <span aria-hidden className="size-12 rounded-sm border border-control-line" />
        <span aria-hidden className="size-12 rounded-md border border-control-line" />
        <span aria-hidden className="size-12 rounded-lg border border-control-line" />
        <span aria-hidden className="size-12 rounded-full border border-control-line" />
      </ShowcaseRow>
      <ShowcaseRow label="Type scale">
        <div className="flex w-full flex-col gap-2">
          {typeScale.map((step) => (
            <p key={step.name} className={cn("truncate", step.className)}>
              <span className="sr-only">{step.name}: </span>Tend your world
            </p>
          ))}
        </div>
      </ShowcaseRow>
    </ShowcaseSection>
  );
}
