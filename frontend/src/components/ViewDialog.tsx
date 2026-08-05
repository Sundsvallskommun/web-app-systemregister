"use client";

import { Button, Dialog } from "@sk-web-gui/react";
import t from "@/lib/i18n";

export type DialogWidth = "xs" | "sm" | "md" | "lg";

export const MAX_WIDTH_CLASS: Record<DialogWidth, string> = {
  xs: "w-full max-w-[32rem]",
  sm: "w-full max-w-[42rem]",
  md: "w-full max-w-[64rem]",
  lg: "w-full max-w-[80rem]",
};

interface ViewDialogProps {
  open: boolean;
  title: string;
  onClose: () => void;
  maxWidth?: DialogWidth;
  children: React.ReactNode;
}

export default function ViewDialog({
  open,
  title,
  onClose,
  maxWidth = "md",
  children,
}: ViewDialogProps) {
  return (
    <Dialog
      show={open}
      label={title}
      onClose={onClose}
      className={MAX_WIDTH_CLASS[maxWidth]}
    >
      <Dialog.Content>{children}</Dialog.Content>
      <Dialog.Buttons>
        <Button variant="secondary" onClick={onClose}>
          {t.close}
        </Button>
      </Dialog.Buttons>
    </Dialog>
  );
}
