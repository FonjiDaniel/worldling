"use client";

import type { CSSProperties, ReactElement } from "react";
import { ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";

import { cn } from "@/lib/utils";

/** Series config. `color` must be a token reference such as "var(--color-primary)". */
export type ChartConfig = Record<string, { label: string; color: string }>;

interface ChartContainerProps {
  config: ChartConfig;
  /** Visible title, also the figure's accessible name. */
  title: string;
  /** A text summary of what the chart shows, for people who cannot see it. */
  summary: string;
  children: ReactElement;
  className?: string;
}

// Exposes each series color as --chart-<key> so marks use fill="var(--chart-<key>)".
export function ChartContainer({
  config,
  title,
  summary,
  children,
  className,
}: ChartContainerProps) {
  const style = Object.fromEntries(
    Object.entries(config).map(([key, series]) => [`--chart-${key}`, series.color]),
  ) as CSSProperties;

  return (
    <figure
      className={cn("flex flex-col gap-3 rounded-md border border-line bg-surface p-4", className)}
      style={style}
    >
      <figcaption className="flex flex-col gap-1">
        <span className="wl-h4 text-text">{title}</span>
        <span className="wl-small text-text-muted">{summary}</span>
      </figcaption>
      <div className="h-64 w-full text-caption text-text-muted [&_.recharts-cartesian-grid_line]:stroke-line [&_.recharts-text]:fill-text-muted">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
      <ChartLegend config={config} />
    </figure>
  );
}

function ChartLegend({ config }: { config: ChartConfig }) {
  return (
    <ul className="flex flex-wrap gap-4 wl-small text-text-muted">
      {Object.entries(config).map(([key, series]) => (
        <li key={key} className="inline-flex items-center gap-2">
          <span aria-hidden className="size-3 rounded-sm" style={{ background: series.color }} />
          {series.label}
        </li>
      ))}
    </ul>
  );
}

interface TooltipPayloadItem {
  dataKey?: string | number;
  name?: string | number;
  value?: unknown;
}

interface ChartTooltipContentProps {
  active?: boolean;
  label?: string | number;
  payload?: readonly TooltipPayloadItem[];
  config: ChartConfig;
}

export function ChartTooltipContent({ active, label, payload, config }: ChartTooltipContentProps) {
  if (active !== true || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-sm border border-line bg-surface-raised px-3 py-2 wl-small text-text shadow-panel">
      <p className="font-semibold">{label}</p>
      <ul>
        {payload.map((item) => {
          const key = String(item.dataKey ?? item.name ?? "");
          return (
            <li key={key} className="flex justify-between gap-4 text-text-muted">
              <span>{config[key]?.label ?? key}</span>
              <span className="font-mono text-text tabular-nums">{String(item.value)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function ChartTooltip({ config }: { config: ChartConfig }) {
  return (
    <RechartsTooltip
      cursor={{ fill: "var(--color-surface-raised)" }}
      content={(props) => (
        <ChartTooltipContent
          active={props.active}
          label={props.label}
          payload={props.payload as readonly TooltipPayloadItem[] | undefined}
          config={config}
        />
      )}
    />
  );
}
