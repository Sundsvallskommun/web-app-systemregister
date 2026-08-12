"use client";

import { useEffect, useState } from "react";
import { Input, Select, TextField, Textarea } from "@sk-web-gui/react";
import Field from "@/components/Field";
import FormDialog from "@/components/FormDialog";
import { useAuth } from "@/lib/auth";
import { get } from "@/lib/api";
import type { System, PaginatedResponse } from "@/lib/api";
import { RISK_LEVEL, metaFor } from "@/lib/enums";
import t from "@/lib/i18n";

interface RiskForm {
  title: string;
  description: string;
  probability: string;
  impact: string;
  system: string;
  owner: string;
  dueDate: string;
}

const EMPTY: RiskForm = {
  title: "",
  description: "",
  probability: "medium",
  impact: "medium",
  system: "",
  owner: "",
  dueDate: "",
};

const LEVELS = Object.keys(RISK_LEVEL);

interface SystemOption {
  id: string;
  label: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (risk: {
    id: string;
    title: string;
    description: string;
    probability: string;
    impact: string;
    status: string;
    system: string;
    owner: string;
    dueDate: string;
  }) => void;
}

export default function RiskFormDialog({ open, onClose, onSave }: Props) {
  const { auth } = useAuth();
  const [form, setForm] = useState<RiskForm>(EMPTY);
  const [error, setError] = useState("");
  const [systemOptions, setSystemOptions] = useState<SystemOption[]>([]);

  useEffect(() => {
    if (!open) return;
    setForm(EMPTY);
    setError("");
    if (auth) {
      get<PaginatedResponse<System>>("/systems?limit=100")
        .then((res) =>
          setSystemOptions(
            (res.data ?? []).map((s) => ({
              id: s.systemId,
              label: `${s.systemId} — ${s.name}`,
            })),
          ),
        )
        .catch(() => {});
    }
  }, [open, auth]);

  const update = (field: keyof RiskForm, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSave = () => {
    if (!form.title.trim()) {
      setError(t.required(t.title));
      return;
    }
    onSave({ id: crypto.randomUUID(), ...form, status: "open" });
    onClose();
  };

  return (
    <FormDialog
      open={open}
      title={t.risks.newRisk}
      onClose={onClose}
      onSave={handleSave}
      error={error}
      saveLabel={t.create}
      maxWidth="sm"
    >
      <div className="flex flex-col gap-16">
        <Field label={t.title} required>
          <TextField
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
          />
        </Field>
        <Field label={t.description}>
          <Textarea
            rows={3}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
          />
        </Field>
        <Field label={t.risks.probability}>
          <Select
            value={form.probability}
            onChange={(e) => update("probability", e.target.value)}
            className="w-full"
          >
            {LEVELS.map((l) => (
              <Select.Option key={l} value={l}>
                {metaFor(RISK_LEVEL, l).label}
              </Select.Option>
            ))}
          </Select>
        </Field>
        <Field label={t.risks.impact}>
          <Select
            value={form.impact}
            onChange={(e) => update("impact", e.target.value)}
            className="w-full"
          >
            {LEVELS.map((l) => (
              <Select.Option key={l} value={l}>
                {metaFor(RISK_LEVEL, l).label}
              </Select.Option>
            ))}
          </Select>
        </Field>
        <Field label={t.risks.system}>
          <Select
            value={form.system}
            onChange={(e) => update("system", e.target.value)}
            className="w-full"
          >
            <Select.Option value="">
              {t.systems.selectPlaceholder}
            </Select.Option>
            {systemOptions.map((s) => (
              <Select.Option key={s.id} value={s.id}>
                {s.label}
              </Select.Option>
            ))}
          </Select>
        </Field>
        <Field label={t.risks.responsible}>
          <TextField
            value={form.owner}
            onChange={(e) => update("owner", e.target.value)}
          />
        </Field>
        <Field label={t.risks.deadline}>
          <Input
            type="date"
            value={form.dueDate}
            onChange={(e) => update("dueDate", e.target.value)}
          />
        </Field>
      </div>
    </FormDialog>
  );
}
