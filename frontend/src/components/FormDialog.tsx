"use client";

import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Alert, Box } from "@mui/material";
import t from "@/lib/i18n";

interface FormDialogProps {
  open: boolean;
  title: string;
  onClose: () => void;
  onSave: () => void;
  saving?: boolean;
  error?: string;
  saveLabel?: string;
  maxWidth?: "xs" | "sm" | "md" | "lg";
  children: React.ReactNode;
}

export default function FormDialog({ open, title, onClose, onSave, saving, error, saveLabel, maxWidth = "sm", children }: FormDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth={maxWidth} fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box sx={{ pt: 1 }}>{children}</Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t.cancel}</Button>
        <Button variant="contained" onClick={onSave} disabled={saving}>
          {saving ? t.saving : saveLabel ?? t.save}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
