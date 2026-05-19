"use client";

import { useEffect, useState } from "react";
import { Box, TextField, MenuItem, Autocomplete } from "@mui/material";
import FormDialog from "@/components/FormDialog";
import { useAuth } from "@/lib/auth";
import { get } from "@/lib/api";
import type { System, PaginatedResponse } from "@/lib/api";
import t from "@/lib/i18n";

interface RiskForm { title: string; description: string; probability: string; impact: string; system: string; owner: string; dueDate: string; }
const EMPTY: RiskForm = { title: "", description: "", probability: "medium", impact: "medium", system: "", owner: "", dueDate: "" };

const LEVELS = Object.entries(t.risks.levels).map(([value, label]) => ({ value, label }));

interface SystemOption {
  id: string;
  label: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (risk: { id: string; title: string; description: string; probability: string; impact: string; status: string; system: string; owner: string; dueDate: string }) => void;
}

export default function RiskFormDialog({ open, onClose, onSave }: Props) {
  const { auth } = useAuth();
  const [form, setForm] = useState<RiskForm>(EMPTY);
  const [error, setError] = useState("");
  const [systemOptions, setSystemOptions] = useState<SystemOption[]>([]);
  const [selectedSystem, setSelectedSystem] = useState<SystemOption | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm(EMPTY);
    setSelectedSystem(null);
    setError("");
    if (auth) {
      get<PaginatedResponse<System>>("/systems?limit=100", auth.token)
        .then((res) => setSystemOptions(
          (res.data ?? []).map((s) => ({ id: s.systemId, label: `${s.systemId} — ${s.name}` }))
        ))
        .catch(() => {});
    }
  }, [open, auth]);

  const update = (field: keyof RiskForm, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSave = () => {
    if (!form.title.trim()) { setError(t.required("Titel")); return; }
    onSave({ id: crypto.randomUUID(), ...form, status: "open" });
    onClose();
  };

  return (
    <FormDialog open={open} title={t.risks.newRisk} onClose={onClose} onSave={handleSave} error={error} saveLabel={t.create}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <TextField label="Titel" fullWidth required value={form.title} onChange={(e) => update("title", e.target.value)} />
        <TextField label={t.description} fullWidth multiline rows={3} value={form.description} onChange={(e) => update("description", e.target.value)} />
        <TextField label={t.risks.probability} select fullWidth value={form.probability} onChange={(e) => update("probability", e.target.value)}>
          {LEVELS.map((l) => <MenuItem key={l.value} value={l.value}>{l.label}</MenuItem>)}
        </TextField>
        <TextField label={t.risks.impact} select fullWidth value={form.impact} onChange={(e) => update("impact", e.target.value)}>
          {LEVELS.map((l) => <MenuItem key={l.value} value={l.value}>{l.label}</MenuItem>)}
        </TextField>
        <Autocomplete
          options={systemOptions}
          value={selectedSystem}
          onChange={(_, value) => {
            setSelectedSystem(value);
            update("system", value?.id ?? "");
          }}
          renderInput={(params) => <TextField {...params} label={t.risks.system} placeholder="Sök system..." />}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          noOptionsText="Inga system hittade"
        />
        <TextField label={t.risks.responsible} fullWidth value={form.owner} onChange={(e) => update("owner", e.target.value)} />
        <TextField label={t.risks.deadline} type="date" fullWidth value={form.dueDate} onChange={(e) => update("dueDate", e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
      </Box>
    </FormDialog>
  );
}
