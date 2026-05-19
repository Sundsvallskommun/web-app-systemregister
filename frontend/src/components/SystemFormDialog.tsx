"use client";

import { useEffect, useState } from "react";
import { Box, TextField, MenuItem, Typography } from "@mui/material";
import { KrtSelect } from "@/components/KrtDisplay";
import FormDialog from "@/components/FormDialog";
import { useAuth } from "@/lib/auth";
import { get, post, patch } from "@/lib/api";
import type { System, Organization, Person, Supplier } from "@/lib/api";
import t from "@/lib/i18n";

const STATUSES = ["planned", "development", "production", "deprecated", "retired"];
const HOSTING_TYPES = ["cloud", "internal"];

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
  systemId: "", name: "", description: "", status: "planned", version: "",
  hostingType: "", konfidentialitet: 0, riktighet: 0, tillganglighet: 0,
  ownerOrganizationId: "", systemOwnerId: "", technicalContactId: "", supplierId: "",
};

function systemToForm(sys: System): SystemForm {
  return {
    systemId: sys.systemId, name: sys.name, description: sys.description ?? "",
    status: sys.status, version: sys.version ?? "", hostingType: sys.hostingType ?? "",
    konfidentialitet: sys.konfidentialitet, riktighet: sys.riktighet, tillganglighet: sys.tillganglighet,
    ownerOrganizationId: sys.ownerOrg?.id ?? "", systemOwnerId: sys.systemOwner?.id ?? "",
    technicalContactId: sys.technicalContact?.id ?? "", supplierId: sys.Supplier?.id ?? "",
  };
}

interface Props { mode: "closed" | "create" | "edit"; system: System | null; onClose: () => void; onSaved: () => void; }

export default function SystemFormDialog({ mode, system, onClose, onSaved }: Props) {
  const { auth } = useAuth();
  const [form, setForm] = useState<SystemForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  useEffect(() => { if (mode !== "closed") { setForm(system ? systemToForm(system) : EMPTY_FORM); setError(""); } }, [mode, system]);
  useEffect(() => {
    if (mode === "closed" || !auth) return;
    get<Organization[]>("/organizations", auth.token).then(setOrgs).catch(() => {});
    get<Person[]>("/persons", auth.token).then(setPersons).catch(() => {});
    get<Supplier[]>("/suppliers", auth.token).then(setSuppliers).catch(() => {});
  }, [mode, auth]);

  const update = (field: keyof SystemForm, value: string | number) => setForm((f) => ({ ...f, [field]: value }));

  const handleSave = async () => {
    if (!auth) return;
    if (!form.name.trim()) { setError(t.required(t.name)); return; }
    setSaving(true); setError("");
    try {
      if (mode === "create") {
        const body: Record<string, unknown> = { name: form.name, status: form.status };
        for (const [key, value] of Object.entries(form)) { if (value !== "" && value !== 0 && key !== "name" && key !== "status") body[key] = value; }
        await post("/systems", body, auth.token);
      } else if (system) {
        const body: Record<string, unknown> = {};
        const original = systemToForm(system);
        for (const key of Object.keys(form) as (keyof SystemForm)[]) { if (form[key] !== original[key]) body[key] = form[key] === "" ? null : form[key]; }
        if (Object.keys(body).length === 0) { onClose(); return; }
        await patch(`/systems/${system.id}`, body, auth.token);
      }
      onSaved();
    } catch (err) { setError(err instanceof Error ? err.message : "Kunde inte spara"); }
    finally { setSaving(false); }
  };

  const s = t.systems;
  return (
    <FormDialog open={mode !== "closed"} title={mode === "create" ? s.newSystem : `${s.editSystem}: ${system?.systemId} — ${system?.name}`}
      onClose={onClose} onSave={handleSave} saving={saving} error={error} saveLabel={mode === "create" ? t.create : t.save} maxWidth="md">
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
        {mode === "create" && <TextField label={s.systemId} fullWidth placeholder="t.ex. SYS-005" value={form.systemId} onChange={(e) => update("systemId", e.target.value)} />}
        <TextField label={t.name} fullWidth required value={form.name} onChange={(e) => update("name", e.target.value)} />
        <TextField label={t.version} fullWidth value={form.version} onChange={(e) => update("version", e.target.value)} />
        <TextField label={t.status} select fullWidth value={form.status} onChange={(e) => update("status", e.target.value)}>
          {STATUSES.map((st) => <MenuItem key={st} value={st}>{st}</MenuItem>)}
        </TextField>
        <TextField label={s.hosting} select fullWidth value={form.hostingType} onChange={(e) => update("hostingType", e.target.value)}>
          <MenuItem value="">-</MenuItem>
          {HOSTING_TYPES.map((h) => <MenuItem key={h} value={h}>{h}</MenuItem>)}
        </TextField>
        <TextField label={s.ownerOrg} select fullWidth value={form.ownerOrganizationId} onChange={(e) => update("ownerOrganizationId", e.target.value)}>
          <MenuItem value="">-</MenuItem>
          {orgs.map((o) => <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>)}
        </TextField>
        <TextField label={s.systemOwner} select fullWidth value={form.systemOwnerId} onChange={(e) => update("systemOwnerId", e.target.value)}>
          <MenuItem value="">-</MenuItem>
          {persons.map((p) => <MenuItem key={p.id} value={p.id}>{p.firstName} {p.lastName}</MenuItem>)}
        </TextField>
        <TextField label={s.technicalContact} select fullWidth value={form.technicalContactId} onChange={(e) => update("technicalContactId", e.target.value)}>
          <MenuItem value="">-</MenuItem>
          {persons.map((p) => <MenuItem key={p.id} value={p.id}>{p.firstName} {p.lastName}</MenuItem>)}
        </TextField>
        <TextField label={s.supplier} select fullWidth value={form.supplierId} onChange={(e) => update("supplierId", e.target.value)}>
          <MenuItem value="">-</MenuItem>
          {suppliers.map((su) => <MenuItem key={su.id} value={su.id}>{su.name}</MenuItem>)}
        </TextField>
        <Box sx={{ gridColumn: "1 / -1" }}>
          <TextField label={t.description} fullWidth multiline rows={3} value={form.description} onChange={(e) => update("description", e.target.value)} />
        </Box>
        <Box sx={{ gridColumn: "1 / -1" }}>
          <Typography variant="subtitle2" gutterBottom>{t.krt.title}</Typography>
          <Box sx={{ display: "flex", gap: 4 }}>
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}><Typography variant="caption">{t.krt.confidentiality}</Typography><KrtSelect value={form.konfidentialitet} onChange={(v) => update("konfidentialitet", v)} /></Box>
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}><Typography variant="caption">{t.krt.integrity}</Typography><KrtSelect value={form.riktighet} onChange={(v) => update("riktighet", v)} /></Box>
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}><Typography variant="caption">{t.krt.availability}</Typography><KrtSelect value={form.tillganglighet} onChange={(v) => update("tillganglighet", v)} /></Box>
          </Box>
        </Box>
      </Box>
    </FormDialog>
  );
}
