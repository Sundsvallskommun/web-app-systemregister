"use client";

import { Alert, Button, Dialog } from "@sk-web-gui/react";
import { MAX_WIDTH_CLASS, type DialogWidth } from "@/components/ViewDialog";
import t from "@/lib/i18n";

interface FormDialogProps {
  open: boolean;
  title: string;
  onClose: () => void;
  onSave: () => void;
  saving?: boolean;
  error?: string;
  saveLabel?: string;
  maxWidth?: DialogWidth;
  children: React.ReactNode;
}

export default function FormDialog({
  open,
  title,
  onClose,
  onSave,
  saving,
  error,
  saveLabel,
  maxWidth = "md",
  children,
}: FormDialogProps) {
  return (
    <Dialog
      show={open}
      label={title}
      onClose={onClose}
      className={MAX_WIDTH_CLASS[maxWidth]}
    >
      <Dialog.Content>
        {error && (
          <Alert type="error" size="sm" className="mb-16">
            {error}
          </Alert>
        )}
        {children}
      </Dialog.Content>
      <Dialog.Buttons>
        <Button variant="secondary" onClick={onClose}>
          {t.cancel}
        </Button>
        <Button
          variant="primary"
          onClick={onSave}
          loading={saving}
          loadingText={t.saving}
        >
          {saveLabel ?? t.save}
        </Button>
      </Dialog.Buttons>
    </Dialog>
  );
}
