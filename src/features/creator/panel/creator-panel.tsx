"use client";

import { Cloud, Mountain, Palette, PenLine, Sparkles } from "lucide-react";
import { type ReactNode, useId } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TiltedWorldIcon } from "@/components/icons/tilted-world";
import { cn } from "@/lib/utils";

import { type CreatorTab, useCreator } from "../store";
import type { CreatorActions } from "../use-creator-actions";
import { Colors } from "./colors";
import { NameField } from "./name-field";
import { Presets } from "./presets";
import { SliderRow } from "./slider-row";

// The control panel (06 creator). Tabs follow the mockup; inside them sit the six SPEC
// sections: Landscape holds Presets, Shape and Colors; Atmosphere holds Sky; Details holds
// Motion and Name (ADR-022).

function Section({
  title,
  icon,
  children,
  labelId,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  labelId?: string;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h3 id={labelId} className="flex items-center gap-2 wl-label text-text-muted [&_svg]:size-4">
        <span aria-hidden className="contents">
          {icon}
        </span>
        {title}
      </h3>
      {children}
    </section>
  );
}

export interface CreatorPanelProps {
  actions: CreatorActions;
  /** Show the name problem even before the person touched the name (after a claim attempt). */
  showNameProblem: boolean;
  onTabChange: (tab: CreatorTab) => void;
  /** Extra classes for the scrolling area, so the sheet and the side panel can size it. */
  bodyClassName?: string;
}

export function CreatorPanel({
  actions,
  showNameProblem,
  onTabChange,
  bodyClassName,
}: CreatorPanelProps) {
  const tab = useCreator((state) => state.tab);
  const presetsId = useId();

  return (
    <Tabs
      value={tab}
      onValueChange={(next) => {
        onTabChange(next as CreatorTab);
      }}
      className="flex min-h-0 flex-1 flex-col"
    >
      <TabsList aria-label="World controls" className="shrink-0">
        <TabsTrigger value="landscape">Landscape</TabsTrigger>
        <TabsTrigger value="atmosphere">Atmosphere</TabsTrigger>
        <TabsTrigger value="details">Details</TabsTrigger>
      </TabsList>
      <div className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain", bodyClassName)}>
        <TabsContent value="landscape" className="flex flex-col gap-6 pb-2">
          <Section title="Presets" icon={<Sparkles />} labelId={presetsId}>
            <Presets actions={actions} labelledBy={presetsId} />
          </Section>
          <Section title="Shape" icon={<Mountain />}>
            <SliderRow control="amplitude" />
            <SliderRow control="roughness" />
            <SliderRow control="scale" />
            <SliderRow control="seaLevel" />
          </Section>
          <Section title="Colors" icon={<Palette />}>
            <Colors actions={actions} />
          </Section>
        </TabsContent>
        <TabsContent value="atmosphere" className="flex flex-col gap-6 pb-2">
          <Section title="Sky" icon={<Cloud />}>
            <SliderRow control="coverage" />
            <SliderRow control="cloudSpeed" />
            <SliderRow control="density" />
            <SliderRow control="gloss" />
          </Section>
        </TabsContent>
        <TabsContent value="details" className="flex flex-col gap-6 pb-2">
          <Section title="Motion" icon={<TiltedWorldIcon />}>
            <SliderRow control="spin" />
            <SliderRow control="tilt" />
          </Section>
          <Section title="Name" icon={<PenLine />}>
            <NameField showProblem={showNameProblem} />
          </Section>
        </TabsContent>
      </div>
    </Tabs>
  );
}
