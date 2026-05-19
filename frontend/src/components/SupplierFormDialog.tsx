"use client";

import { useEffect, useState } from "react";
import { Box, TextField, Switch, FormControlLabel } from "@mui/material";
import FormDialog from "@/components/FormDialog";
import { useAuth } from "@/lib/auth";
import { post, patch } from "@/lib/api";
import type { Supplier } from "@/lib/api";
import t from "@/lib/i18n";

interface SupplierForm { name: string; description: string; orgNumber: string; website: string; contactEmail: string; isActive: boolean; }

const EMPTY: SupplierForm = { name: "", description: "", orgNumber: "", website: "", contactEmail: "", isActive: true };

function toForm(s: Supplier): SupplierForm {
  return { name: s.name, description: s.description ?? "", orgNumber: s.orgNumber ?? "", website: s.website ?? "", contactEmail: s.contactEmail ?? "", isActive: s.isActive };
}

interface Props { mode: "closed" | "create" | "edit"; supplier: Supplier | null; onClose: () => void; onSaved: () => void; }

export default function SupplierFormDialog({ mode, supplier, onClose, onSaved }: Props) {
  const { auth } = useAuth();
  const [form, setForm] = useState<SupplierForm>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { if (mode !== "closed") { setForm(supplier ? toForm(supplier) : EMPTY); setError(""); } }, [mode, supplier]);

  const update = (field: keyof SupplierForm, value: string | boolean) => setForm((f) => ({ ...f, [field]: value }));

  const handleSave = async () => {
    if (!auth) return;
    if (!form.name.trim()) { setError(t.required(t.name)); return; }
    setSaving(true); setError("");
    try {
      if (mode === "create") {
        const body: Record<string, unknown> = { name: form.name, isActive: form.isActive };
        if (form.description) body.description = form.description;
        if (form.orgNumber) body.orgNumber = form.orgNumber;
        if (form.website) body.website = form.website;
        if (form.contactEmail) body.contactEmail = form.contactEmail;
        await post("/suppliers", body, auth.token);
      } else if (supplier) {
        const body: Record<string, unknown> = {};
        const original = toForm(supplier);
        for (const key of Object.keys(form) as (keyof SupplierForm)[]) { if (form[key] !== original[key]) body[key] = form[key] === "" ? null : form[key]; }
        if (Object.keys(body).length === 0) { onClose(); return; }
        await patch(`/suppliers/${supplier.id}`, body, auth.token);
      }
      onSaved();
    } catch (err) { setError(err instanceof Error ? err.message : "Kunde inte spara"); }
    finally { setSaving(false); }
  };

  const s = t.suppliers;
  return (
    <FormDialog open={mode !== "closed"} title={mode === "create" ? s.newSupplier : `${s.editSupplier}: ${supplier?.name}`}
      onClose={onClose} onSave={handleSave} saving={saving} error={error} saveLabel={mode === "create" ? t.create : t.save}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <TextField label={t.name} fullWidth required value={form.name} onChange={(e) => update("name", e.target.value)} />
        <TextField label={s.orgNumber} fullWidth value={form.orgNumber} onChange={(e) => update("orgNumber", e.target.value)} placeholder="t.ex. 556123-4567" />
        <TextField label={s.contactEmail} fullWidth type="email" value={form.contactEmail} onChange={(e) => update("contactEmail", e.target.value)} />
        <TextField label={s.website} fullWidth value={form.website} onChange={(e) => update("website", e.target.value)} placeholder="https://..." />
        <TextField label={t.description} fullWidth multiline rows={3} value={form.description} onChange={(e) => update("description", e.target.value)} />
        <FormControlLabel control={<Switch checked={form.isActive} onChange={(e) => update("isActive", e.target.checked)} />} label={t.active} />
      </Box>
    </FormDialog>
  );
}
