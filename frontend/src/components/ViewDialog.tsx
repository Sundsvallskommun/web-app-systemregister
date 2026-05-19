"use client";

import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";
import t from "@/lib/i18n";

interface ViewDialogProps {
  open: boolean;
  title: string;
  onClose: () => void;
  maxWidth?: "xs" | "sm" | "md" | "lg";
  children: React.ReactNode;
}

export default function ViewDialog({ open, title, onClose, maxWidth = "md", children }: ViewDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth={maxWidth} fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>{children}</DialogContent>
      <DialogActions><Button onClick={onClose}>{t.close}</Button></DialogActions>
    </Dialog>
  );
}
