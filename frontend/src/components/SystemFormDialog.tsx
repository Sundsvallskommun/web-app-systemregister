"use client";

import { useEffect, useState } from "react";
import { Select, TextField, Textarea } from "@sk-web-gui/react";
import { KrtSelect } from "@/components/KrtDisplay";
import Field from "@/components/Field";
import FormDialog from "@/components/FormDialog";
import { useAuth } from "@/lib/auth";
import { get, post, patch } from "@/lib/api";
import type { System, Organization, Person, Supplier } from "@/lib/api";
import { SYSTEM_STATUS, HOSTING_TYPE, metaFor } from "@/lib/enums";
import t from "@/lib/i18n";

const STATUSES = Object.keys(SYSTEM_STATUS);
const HOSTING_TYPES = Object.keys(HOSTING_TYPE);

interface SystemForm {
  systemId: string;
  name: string;
  description: string;
  status: string;
  version: string;
  hostingType: string;
  konfidentialitet: number;
  riktighet: number;
  tillganglighet: number;
  ownerOrganizationId: string;
  systemOwnerId: string;
  technicalContactId: string;
  supplierId: string;
}

const EMPTY_FORM: SystemForm = {
  systemId: "",
  name: "",
  description: "",
  status: "planned",
  version: "",
  hostingType: "",
  konfidentialitet: 0,
  riktighet: 0,
  tillganglighet: 0,
  ownerOrganizationId: "",
  systemOwnerId: "",
  technicalContactId: "",
  supplierId: "",
};

function systemToForm(sys: System): SystemForm {
  return {
    systemId: sys.systemId,
    name: sys.name,
    description: sys.description ?? "",
    status: sys.status.toLowerCase(),
    version: sys.version ?? "",
    hostingType: sys.hostingType?.toLowerCase() ?? "",
    konfidentialitet: sys.konfidentialitet,
    riktighet: sys.riktighet,
    tillganglighet: sys.tillganglighet,
    ownerOrganizationId: sys.ownerOrg?.id ?? "",
    systemOwnerId: sys.systemOwner?.id ?? "",
    technicalContactId: sys.technicalContact?.id ?? "",
    supplierId: sys.Supplier?.id ?? "",
  };
}

interface Props {
  mode: "closed" | "create" | "edit";
  system: System | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function SystemFormDialog({
  mode,
  system,
  onClose,
  onSaved,
}: Props) {
  const { auth } = useAuth();
  const [form, setForm] = useState<SystemForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  useEffect(() => {
    if (mode !== "closed") {
      setForm(system ? systemToForm(system) : EMPTY_FORM);
      setError("");
    }
  }, [mode, system]);

  useEffect(() => {
    if (mode === "closed" || !auth) return;
    get<Organization[]>("/organizations", auth.token)
      .then(setOrgs)
      .catch(() => {});
    get<Person[]>("/persons", auth.token)
      .then(setPersons)
      .catch(() => {});
    get<Supplier[]>("/suppliers", auth.token)
      .then(setSuppliers)
      .catch(() => {});
  }, [mode, auth]);

  const update = (field: keyof SystemForm, value: string | number) =>
    setForm((f) => ({ ...f, [field]: value }));

  const systemsText = t.systems;

  const handleSave = async () => {
    if (!auth) return;
    if (mode === "create" && !form.systemId.trim()) {
      setError(t.required(systemsText.systemId));
      return;
    }
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
          status: form.status,
        };
        for (const [key, value] of Object.entries(form)) {
          if (value !== "" && value !== 0 && key !== "name" && key !== "status")
            body[key] = value;
        }
        await post("/systems", body, auth.token);
      } else if (system) {
        const body: Record<string, unknown> = {};
        const original = systemToForm(system);
        for (const key of Object.keys(form) as (keyof SystemForm)[]) {
          if (form[key] !== original[key])
            body[key] = form[key] === "" ? null : form[key];
        }
        if (Object.keys(body).length === 0) {
          onClose();
          return;
        }
        await patch(`/systems/${system.id}`, body, auth.token);
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
          ? systemsText.newSystem
          : `${systemsText.editSystem}: ${system?.systemId} — ${system?.name}`
      }
      onClose={onClose}
      onSave={handleSave}
      saving={saving}
      error={error}
      saveLabel={mode === "create" ? t.create : t.save}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-16">
        {mode === "create" && (
          <Field label={systemsText.systemId} required>
            <TextField
              placeholder={systemsText.systemIdPlaceholder}
              value={form.systemId}
              onChange={(e) => update("systemId", e.target.value)}
            />
          </Field>
        )}
        <Field label={t.name} required>
          <TextField
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
          />
        </Field>
        <Field label={t.version}>
          <TextField
            value={form.version}
            onChange={(e) => update("version", e.target.value)}
          />
        </Field>
        <Field label={t.status}>
          <Select
            value={form.status}
            onChange={(e) => update("status", e.target.value)}
            className="w-full"
          >
            {STATUSES.map((st) => (
              <Select.Option key={st} value={st}>
                {metaFor(SYSTEM_STATUS, st).label}
              </Select.Option>
            ))}
          </Select>
        </Field>
        <Field label={systemsText.hosting}>
          <Select
            value={form.hostingType}
            onChange={(e) => update("hostingType", e.target.value)}
            className="w-full"
          >
            <Select.Option value="">{t.emptyValue}</Select.Option>
            {HOSTING_TYPES.map((h) => (
              <Select.Option key={h} value={h}>
                {metaFor(HOSTING_TYPE, h).label}
              </Select.Option>
            ))}
          </Select>
        </Field>
        <Field label={systemsText.ownerOrg}>
          <Select
            value={form.ownerOrganizationId}
            onChange={(e) => update("ownerOrganizationId", e.target.value)}
            className="w-full"
          >
            <Select.Option value="">{t.emptyValue}</Select.Option>
            {orgs.map((o) => (
              <Select.Option key={o.id} value={o.id}>
                {o.name}
              </Select.Option>
            ))}
          </Select>
        </Field>
        <Field label={systemsText.systemOwner}>
          <Select
            value={form.systemOwnerId}
            onChange={(e) => update("systemOwnerId", e.target.value)}
            className="w-full"
          >
            <Select.Option value="">{t.emptyValue}</Select.Option>
            {persons.map((p) => (
              <Select.Option key={p.id} value={p.id}>
                {p.firstName} {p.lastName}
              </Select.Option>
            ))}
          </Select>
        </Field>
        <Field label={systemsText.technicalContact}>
          <Select
            value={form.technicalContactId}
            onChange={(e) => update("technicalContactId", e.target.value)}
            className="w-full"
          >
            <Select.Option value="">{t.emptyValue}</Select.Option>
            {persons.map((p) => (
              <Select.Option key={p.id} value={p.id}>
                {p.firstName} {p.lastName}
              </Select.Option>
            ))}
          </Select>
        </Field>
        <Field label={systemsText.supplier}>
          <Select
            value={form.supplierId}
            onChange={(e) => update("supplierId", e.target.value)}
            className="w-full"
          >
            <Select.Option value="">{t.emptyValue}</Select.Option>
            {suppliers.map((su) => (
              <Select.Option key={su.id} value={su.id}>
                {su.name}
              </Select.Option>
            ))}
          </Select>
        </Field>
        <Field label={t.description} className="sm:col-span-2">
          <Textarea
            rows={3}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
          />
        </Field>
        <div className="sm:col-span-2">
          <p className="text-small font-bold mb-14">{t.krt.title}</p>
          <div className="flex flex-col gap-12">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-0">
              <span className="text-small w-[12rem] shrink-0">
                {t.krt.confidentiality}
              </span>
              <KrtSelect
                value={form.konfidentialitet}
                onChange={(v) => update("konfidentialitet", v)}
              />
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-0">
              <span className="text-small w-[12rem] shrink-0">
                {t.krt.integrity}
              </span>
              <KrtSelect
                value={form.riktighet}
                onChange={(v) => update("riktighet", v)}
              />
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-0">
              <span className="text-small w-[12rem] shrink-0">
                {t.krt.availability}
              </span>
              <KrtSelect
                value={form.tillganglighet}
                onChange={(v) => update("tillganglighet", v)}
              />
            </div>
          </div>
        </div>
      </div>
    </FormDialog>
  );
}
