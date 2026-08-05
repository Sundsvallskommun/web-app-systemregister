"use client";

import { useEffect, useState } from "react";
import { Select } from "@sk-web-gui/react";
import Field from "@/components/Field";
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
    if (user) {
      setRole(user.role);
      setError("");
    }
  }, [user]);

  const handleSave = async () => {
    if (!user || !auth) return;
    setSaving(true);
    setError("");
    try {
      await patch(`/admin/users/${user.id}/role`, { role }, auth.token);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.saveFailed);
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDialog
      open={!!user}
      title={`${t.admin.editRole}: ${user?.username}`}
      onClose={onClose}
      onSave={handleSave}
      saving={saving}
      error={error}
      maxWidth="xs"
    >
      <Field label={t.admin.role}>
        <Select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full"
        >
          {Object.entries(t.roles).map(([value, label]) => (
            <Select.Option key={value} value={value}>
              {label}
            </Select.Option>
          ))}
        </Select>
      </Field>
    </FormDialog>
  );
}
