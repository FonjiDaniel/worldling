import { Sprout } from "lucide-react";

import { progressFor } from "@convex/shared/bloom";
import { nextBloomLine } from "@convex/shared/bloomCopy";

// The 06 mockup's bloom card: level, progress through it, and what the next bloom brings.

function valueText(level: number, fraction: number, atTop: boolean): string {
  if (atTop) return `Level ${level}, in full bloom`;
  return `Level ${level}, ${Math.round(fraction * 100)} percent of the way to level ${level + 1}`;
}

export function BloomCard({ xp }: { xp: number }) {
  const { level, levelXp, nextXp, fraction } = progressFor(xp);
  const atTop = nextXp === null;
  return (
    <section
      aria-labelledby="bloom-level"
      className="flex flex-col gap-3 rounded-md border border-line bg-surface p-panel-pad"
    >
      <div className="flex items-center gap-3">
        <Sprout aria-hidden className="size-5 text-accent" />
        <h2 id="bloom-level" className="wl-label text-text-muted">
          Bloom level
        </h2>
        <span className="ml-auto font-mono text-h3 text-text tabular-nums">
          {String(level).padStart(2, "0")}
        </span>
      </div>
      <div
        role="progressbar"
        aria-labelledby="bloom-level"
        aria-valuemin={0}
        aria-valuemax={atTop ? 1 : nextXp - levelXp}
        aria-valuenow={atTop ? 1 : xp - levelXp}
        aria-valuetext={valueText(level, fraction, atTop)}
        className="h-1.5 overflow-hidden rounded-full bg-surface-raised"
      >
        <div
          className="h-full origin-left rounded-full bg-accent transition-transform duration-bloom ease-out motion-reduce:transition-none"
          style={{ transform: `scaleX(${fraction})` }}
        />
      </div>
      <p className="wl-small text-text-muted">{nextBloomLine(level)}</p>
    </section>
  );
}
