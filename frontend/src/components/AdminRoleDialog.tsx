"use client";

import { useEffect, useState } from "react";
import { TextField, MenuItem } from "@mui/material";
import FormDialog from "@/components/FormDialog";
import { useAuth } from "@/lib/auth";
import { patch } from "@/lib/api";
import type { AdminUser } from "@/lib/api";
import t from "@/lib/i18n";

interface Props {
  user: AdminUser | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function AdminRoleDialog({ user, onClose, onSaved }: Props) {
  const { auth } = useAuth();
  const [role, setRole] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) { setRole(user.role); setError(""); }
  }, [user]);

  const handleSave = async () => {
    if (!user || !auth) return;
    setSaving(true);
    setError("");
    try {
      await patch(`/admin/users/${user.id}/role`, { role }, auth.token);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunde inte spara");
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDialog open={!!user} title={`${t.admin.editRole}: ${user?.username}`} onClose={onClose} onSave={handleSave} saving={saving} error={error} maxWidth="xs">
      <TextField select fullWidth label={t.admin.role} value={role} onChange={(e) => setRole(e.target.value)}>
        <MenuItem value="admin">{t.roles.admin}</MenuItem>
        <MenuItem value="editor">{t.roles.editor}</MenuItem>
        <MenuItem value="viewer">{t.roles.viewer}</MenuItem>
      </TextField>
    </FormDialog>
  );
}
