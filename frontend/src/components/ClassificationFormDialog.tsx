"use client";

import { useEffect, useState } from "react";
import { Link } from "@sk-web-gui/react";
import { KrtSelect } from "@/components/KrtDisplay";
import FormDialog from "@/components/FormDialog";
import { useAuth } from "@/lib/auth";
import { patch } from "@/lib/api";
import type { System } from "@/lib/api";
import { isBusinessCritical } from "@/lib/krt";
import t from "@/lib/i18n";

interface ClassificationForm {
  konfidentialitet: number;
  riktighet: number;
  tillganglighet: number;
}

function systemToForm(sys: System): ClassificationForm {
  return {
    konfidentialitet: sys.konfidentialitet,
    riktighet: sys.riktighet,
    tillganglighet: sys.tillganglighet,
  };
}

const ASPECTS: { field: keyof ClassificationForm; label: string }[] = [
  { field: "konfidentialitet", label: t.krt.confidentiality },
  { field: "riktighet", label: t.krt.integrity },
  { field: "tillganglighet", label: t.krt.availability },
];

interface Props {
  system: System | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function ClassificationFormDialog({
  system,
  onClose,
  onSaved,
}: Props) {
  const { auth } = useAuth();
  const [form, setForm] = useState<ClassificationForm>({
    konfidentialitet: 0,
    riktighet: 0,
    tillganglighet: 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (system) {
      setForm(systemToForm(system));
      setError("");
    }
  }, [system]);

  const update = (field: keyof ClassificationForm, value: number) =>
    setForm((f) => ({ ...f, [field]: value }));

  const businessCritical = isBusinessCritical(
    form.riktighet,
    form.tillganglighet,
  );

  const handleSave = async () => {
    if (!auth || !system) return;
    setSaving(true);
    setError("");
    try {
      const original = systemToForm(system);
      const body: Record<string, number> = {};
      for (const key of Object.keys(form) as (keyof ClassificationForm)[]) {
        if (form[key] !== original[key]) body[key] = form[key];
      }
      if (Object.keys(body).length === 0) {
        onClose();
        return;
      }
      await patch(`/systems/${system.id}`, body);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.saveFailed);
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDialog
      open={!!system}
      title={t.krt.classifyTitle(system?.systemId ?? "", system?.name ?? "")}
      onClose={onClose}
      onSave={handleSave}
      saving={saving}
      error={error}
    >
      <div className="flex flex-col gap-12">
        {ASPECTS.map(({ field, label }) => (
          <div
            key={field}
            className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-0"
          >
            <span className="text-small w-[12rem] shrink-0">{label}</span>
            <KrtSelect
              value={form[field]}
              onChange={(v) => update(field, v)}
            />
          </div>
        ))}
      </div>

      {/* Rutan dyker upp så fort klassningen gör systemet verksamhetskritiskt.
          Byggd av tokens i stället för <Alert>, som är till för avfärdbara
          meddelanden — det här är permanent information om klassningen. */}
      {businessCritical && (
        <div
          role="status"
          className="mt-24 flex flex-col gap-8"
        >
          <span className="text-small">{t.krt.businessCriticalHit}</span>
          <Link href={t.krt.mcfUrl} external size="sm">
            {t.krt.mcfLinkLabel}
          </Link>
        </div>
      )}

      <p className="text-small text-dark-secondary mt-16">
        {t.krt.upcomingFields}
      </p>
    </FormDialog>
  );
}
