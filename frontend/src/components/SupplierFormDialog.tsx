"use client";

import { useEffect, useState } from "react";
import { Switch, TextField, Textarea } from "@sk-web-gui/react";
import Field from "@/components/Field";
import FormDialog from "@/components/FormDialog";
import { useAuth } from "@/lib/auth";
import { post, patch } from "@/lib/api";
import type { Supplier } from "@/lib/api";
import t from "@/lib/i18n";

interface SupplierForm {
  name: string;
  description: string;
  orgNumber: string;
  website: string;
  contactEmail: string;
  isActive: boolean;
}

const EMPTY: SupplierForm = {
  name: "",
  description: "",
  orgNumber: "",
  website: "",
  contactEmail: "",
  isActive: true,
};

function toForm(s: Supplier): SupplierForm {
  return {
    name: s.name,
    description: s.description ?? "",
    orgNumber: s.orgNumber ?? "",
    website: s.website ?? "",
    contactEmail: s.contactEmail ?? "",
    isActive: s.isActive,
  };
}

interface Props {
  mode: "closed" | "create" | "edit";
  supplier: Supplier | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function SupplierFormDialog({
  mode,
  supplier,
  onClose,
  onSaved,
}: Props) {
  const { auth } = useAuth();
  const [form, setForm] = useState<SupplierForm>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (mode !== "closed") {
      setForm(supplier ? toForm(supplier) : EMPTY);
      setError("");
    }
  }, [mode, supplier]);

  const update = (field: keyof SupplierForm, value: string | boolean) =>
    setForm((f) => ({ ...f, [field]: value }));

  const suppliersText = t.suppliers;

  const handleSave = async () => {
    if (!auth) return;
    if (!form.name.trim()) {
      setError(t.required(t.name));
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (mode === "create") {
        const body: Record<string, unknown> = {
          name: form.name,
          isActive: form.isActive,
        };
        if (form.description) body.description = form.description;
        if (form.orgNumber) body.orgNumber = form.orgNumber;
        if (form.website) body.website = form.website;
        if (form.contactEmail) body.contactEmail = form.contactEmail;
        await post("/suppliers", body, auth.token);
      } else if (supplier) {
        const body: Record<string, unknown> = {};
        const original = toForm(supplier);
        for (const key of Object.keys(form) as (keyof SupplierForm)[]) {
          if (form[key] !== original[key])
            body[key] = form[key] === "" ? null : form[key];
        }
        if (Object.keys(body).length === 0) {
          onClose();
          return;
        }
        await patch(`/suppliers/${supplier.id}`, body, auth.token);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.saveFailed);
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDialog
      open={mode !== "closed"}
      title={
        mode === "create"
          ? suppliersText.newSupplier
          : `${suppliersText.editSupplier}: ${supplier?.name}`
      }
      onClose={onClose}
      onSave={handleSave}
      saving={saving}
      error={error}
      saveLabel={mode === "create" ? t.create : t.save}
      maxWidth="sm"
    >
      <div className="flex flex-col gap-16">
        <Field label={t.name} required>
          <TextField
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
          />
        </Field>
        <Field label={suppliersText.orgNumber}>
          <TextField
            placeholder={suppliersText.orgNumberPlaceholder}
            value={form.orgNumber}
            onChange={(e) => update("orgNumber", e.target.value)}
          />
        </Field>
        <Field label={suppliersText.contactEmail}>
          <TextField
            type="email"
            value={form.contactEmail}
            onChange={(e) => update("contactEmail", e.target.value)}
          />
        </Field>
        <Field label={suppliersText.website}>
          <TextField
            placeholder={suppliersText.websitePlaceholder}
            value={form.website}
            onChange={(e) => update("website", e.target.value)}
          />
        </Field>
        <Field label={t.description}>
          <Textarea
            rows={3}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
          />
        </Field>
        <label className="flex items-center gap-8">
          <Switch
            checked={form.isActive}
            onChange={(e) => update("isActive", e.target.checked)}
          />
          <span className="text-small">{t.active}</span>
        </label>
      </div>
    </FormDialog>
  );
}
