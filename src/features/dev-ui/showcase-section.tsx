import type { ReactNode } from "react";

interface ShowcaseSectionProps {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
}

export function ShowcaseSection({ id, title, description, children }: ShowcaseSectionProps) {
  const headingId = `${id}-heading`;
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="flex scroll-mt-8 flex-col gap-5 border-t border-line pt-8"
    >
      <div className="flex flex-col gap-1">
        <h2 id={headingId} className="text-2xl font-semibold">
          {title}
        </h2>
        {description ? <p className="max-w-prose text-text-muted">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function ShowcaseRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-sans text-sm font-medium text-text-muted">{label}</h3>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}
