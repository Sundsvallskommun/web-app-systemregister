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
  onBack?: () => void;
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
  onBack,
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
        {onBack && (
          <Button variant="secondary" onClick={onBack}>
            {t.back}
          </Button>
        )}
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
