"use client";

import { Label, SegmentedControl } from "@sk-web-gui/react";
import { KRT_LEVEL_COLOR } from "@/lib/enums";
import t from "@/lib/i18n";

export function KrtChip({ value }: { value: number }) {
  return (
    <Label
      rounded
      color={KRT_LEVEL_COLOR[value] ?? "tertiary"}
      inverted={value === 4}
    >
      {value >= 1 && value <= 4 ? value : t.emptyValue}
    </Label>
  );
}

export function KrtSelect({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const levels = [1, 2, 3, 4];

  return (
    <SegmentedControl
      size="md"
      value={levels.includes(value) ? [levels.indexOf(value)] : []}
      onChange={([index]) => {
        if (index !== undefined) onChange(levels[index]);
      }}
    >
      {levels.map((n) => (
        <SegmentedControl.Item key={n}>
          <button type="button">{n}</button>
        </SegmentedControl.Item>
      ))}
    </SegmentedControl>
  );
}
