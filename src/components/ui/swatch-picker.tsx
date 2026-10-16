"use client";

import { Check } from "lucide-react";
import { RadioGroup } from "radix-ui";
import { type ComponentProps, useId, useState } from "react";

import { cn } from "@/lib/utils";

export interface Swatch {
  value: string;
  /** Spoken and shown name, so color is never the only signal. */
  name: string;
  /** Display color from world data (palettes), not a UI color. */
  color: string;
}

type SwatchPickerProps = Omit<
  ComponentProps<typeof RadioGroup.Root>,
  "children" | "orientation"
> & {
  label: string;
  swatches: readonly Swatch[];
};

export function SwatchPicker({
  label,
  swatches,
  value,
  defaultValue,
  onValueChange,
  className,
  ...props
}: SwatchPickerProps) {
  const labelId = useId();
  const [inner, setInner] = useState(defaultValue);
  const selected = swatches.find((swatch) => swatch.value === (value ?? inner));

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <p id={labelId} className="text-sm font-medium text-text">
        {label}
        {selected ? <span className="font-normal text-text-muted">: {selected.name}</span> : null}
      </p>
      <RadioGroup.Root
        aria-labelledby={labelId}
        orientation="horizontal"
        className="flex flex-wrap gap-2"
        value={value}
        defaultValue={defaultValue}
        onValueChange={(next) => {
          setInner(next);
          onValueChange?.(next);
        }}
        {...props}
      >
        {swatches.map((swatch) => (
          <RadioGroup.Item
            key={swatch.value}
            value={swatch.value}
            aria-label={swatch.name}
            title={swatch.name}
            style={{ backgroundColor: swatch.color }}
            className="group grid size-touch place-items-center rounded-full border-2 border-control-line transition-transform duration-fast ease-out hover:scale-105 data-[state=checked]:border-text"
          >
            <RadioGroup.Indicator className="grid size-6 place-items-center rounded-full bg-void text-text">
              <Check aria-hidden className="size-4" />
            </RadioGroup.Indicator>
          </RadioGroup.Item>
        ))}
      </RadioGroup.Root>
    </div>
  );
}
