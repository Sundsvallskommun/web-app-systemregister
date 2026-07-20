"use client";

import { Label } from "@sk-web-gui/react";
import { metaFor, type EnumMap } from "@/lib/enums";

interface EnumLabelProps {
  value: string;
  map: EnumMap;
  rounded?: boolean;
}

export default function EnumLabel({ value, map, rounded }: EnumLabelProps) {
  const meta = metaFor(map, value);
  return (
    <Label color={meta.color} rounded={rounded}>
      {meta.label}
    </Label>
  );
}
