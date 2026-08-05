"use client";

import { FormControl, FormLabel, cx } from "@sk-web-gui/react";

interface FieldProps {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export default function Field({
  label,
  required,
  className,
  children,
}: FieldProps) {
  return (
    <FormControl className={cx("w-full", className)}>
      <FormLabel showRequired={required}>{label}</FormLabel>
      {children}
    </FormControl>
  );
}
