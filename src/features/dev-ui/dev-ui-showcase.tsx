import { ActionsSection } from "./actions-section";
import { DataSection } from "./data-section";
import { FeedbackSection } from "./feedback-section";
import { FormsSection } from "./forms-section";
import { OverlaysSection } from "./overlays-section";
import { StatesSection } from "./states-section";
import { TokensSection } from "./tokens-section";

const sections = [
  { id: "tokens", title: "Tokens" },
  { id: "actions", title: "Actions" },
  { id: "forms", title: "Forms" },
  { id: "overlays", title: "Overlays" },
  { id: "feedback", title: "Feedback" },
  { id: "states", title: "States" },
  { id: "data", title: "Data" },
] as const;

export function DevUiShowcase() {
  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-10 px-4 py-12 sm:px-6">
      <header className="flex flex-col gap-3">
        <p className="font-mono text-sm text-accent">/dev/ui</p>
        <h1 className="text-3xl font-semibold">Worldling UI kit</h1>
        <p className="max-w-prose text-lg text-text-muted">
          Every component and state in one place. Development only.
        </p>
        <nav aria-label="Sections">
          <ul className="flex flex-wrap gap-x-4 gap-y-1">
            {sections.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`} className="text-link underline underline-offset-4">
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <TokensSection />
      <ActionsSection />
      <FormsSection />
      <OverlaysSection />
      <FeedbackSection />
      <StatesSection />
      <DataSection />
    </div>
  );
}
