"use client";

import { useState } from "react";

import { Field, FieldError, FieldHint, Label } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Slider } from "@/components/ui/slider";
import { type Swatch, SwatchPicker } from "@/components/ui/swatch-picker";
import { Textarea } from "@/components/ui/textarea";

import { ShowcaseRow, ShowcaseSection } from "./showcase-section";

// Sample world palette data (world colors are data, not UI tokens).
const oceanSwatches: Swatch[] = [
  { value: "lagoon", name: "Lagoon", color: "var(--color-aurora-500)" },
  { value: "deep", name: "Deep sea", color: "var(--color-aurora-800)" },
  { value: "violet", name: "Violet tide", color: "var(--color-nebula-400)" },
  { value: "amber", name: "Amber shallows", color: "var(--color-sunrise-300)" },
];

export function FormsSection() {
  const [ocean, setOcean] = useState([40]);
  return (
    <ShowcaseSection id="forms" title="Forms" description="Every control has a visible label.">
      <div className="grid gap-6 md:grid-cols-2">
        <Field>
          <Label htmlFor="demo-name">World name</Label>
          <Input id="demo-name" placeholder="Pebble" aria-describedby="demo-name-hint" />
          <FieldHint id="demo-name-hint">You can change it any time.</FieldHint>
        </Field>
        <Field>
          <Label htmlFor="demo-username">Username</Label>
          <Input
            id="demo-username"
            defaultValue="admin"
            aria-invalid
            aria-describedby="demo-username-error"
          />
          <FieldError id="demo-username-error">That name is taken. Try another one.</FieldError>
        </Field>
        <Field>
          <Label htmlFor="demo-disabled">Disabled</Label>
          <Input id="demo-disabled" defaultValue="Locked for now" disabled />
        </Field>
        <Field>
          <Label htmlFor="demo-comet">Comet message</Label>
          <Textarea
            id="demo-comet"
            maxGraphemes={140}
            defaultValue="Your world made me smile 🌍✨"
          />
        </Field>
      </div>
      <ShowcaseRow label="Slider">
        <div className="flex w-full max-w-panel flex-col gap-2">
          <p className="text-sm text-text" id="demo-ocean-label">
            Ocean level: {ocean[0]}%
          </p>
          <Slider
            label="Ocean level"
            value={ocean}
            onValueChange={setOcean}
            max={100}
            step={1}
            valueText={(value) => `${value} percent`}
          />
          <Slider label="Cloud cover, disabled" defaultValue={[60]} disabled />
        </div>
      </ShowcaseRow>
      <ShowcaseRow label="Swatch picker">
        <SwatchPicker label="Ocean color" swatches={oceanSwatches} defaultValue="lagoon" />
      </ShowcaseRow>
      <ShowcaseRow label="Segmented control">
        <SegmentedControl
          label="Moons"
          segments={[
            { value: "0", label: "None" },
            { value: "1", label: "One" },
            { value: "2", label: "Two" },
          ]}
          defaultValue="1"
        />
        <SegmentedControl
          label="View, disabled"
          segments={[
            { value: "orbit", label: "Orbit" },
            { value: "list", label: "List" },
          ]}
          disabled
        />
      </ShowcaseRow>
    </ShowcaseSection>
  );
}
