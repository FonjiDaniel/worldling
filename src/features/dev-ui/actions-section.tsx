"use client";

import { Heart, Plus, Settings, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";

import { ShowcaseRow, ShowcaseSection } from "./showcase-section";

export function ActionsSection() {
  return (
    <ShowcaseSection
      id="actions"
      title="Actions"
      description="Warm is the one main action per view. Every target meets the touch size token."
    >
      <ShowcaseRow label="Variants">
        <Button>Create your world</Button>
        <Button variant="secondary">Visit a world</Button>
        <Button variant="ghost">Maybe later</Button>
        <Button variant="danger">Delete world</Button>
      </ShowcaseRow>
      <ShowcaseRow label="Sizes">
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg">
          <Sparkles aria-hidden />
          Large
        </Button>
      </ShowcaseRow>
      <ShowcaseRow label="Pending and disabled">
        <Button pending>Sending comet</Button>
        <Button variant="secondary" pending>
          Saving
        </Button>
        <Button disabled>Not yet</Button>
        <Button variant="secondary" disabled>
          Not yet
        </Button>
      </ShowcaseRow>
      <ShowcaseRow label="Icon buttons">
        <IconButton label="Add moon" icon={<Plus />} />
        <IconButton label="Settings" icon={<Settings />} variant="secondary" />
        <IconButton label="Send a comet" icon={<Heart />} variant="primary" />
        <IconButton label="Settings, unavailable" icon={<Settings />} disabled />
      </ShowcaseRow>
    </ShowcaseSection>
  );
}
