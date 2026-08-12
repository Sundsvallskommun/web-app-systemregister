"use client";

import { useEffect, useState } from "react";
import { Card, Link, RadioButton, Textarea } from "@sk-web-gui/react";
import { KrtSelect } from "@/components/KrtDisplay";
import Field from "@/components/Field";
import FormDialog from "@/components/FormDialog";
import { patch } from "@/lib/api";
import type { System } from "@/lib/api";
import { isBusinessCritical } from "@/lib/krt";
import t from "@/lib/i18n";

interface ClassificationForm {
  konfidentialitet: number;
  konfidentialitetMotivering: string;
  riktighet: number;
  riktighetMotivering: string;
  tillganglighet: number;
  tillganglighetMotivering: string;
  samhallsviktigt: boolean;
  samhallsviktigtMotivering: string;
}

const EMPTY_FORM: ClassificationForm = {
  konfidentialitet: 0,
  konfidentialitetMotivering: "",
  riktighet: 0,
  riktighetMotivering: "",
  tillganglighet: 0,
  tillganglighetMotivering: "",
  samhallsviktigt: false,
  samhallsviktigtMotivering: "",
};

function systemToForm(sys: System): ClassificationForm {
  return {
    konfidentialitet: sys.konfidentialitet,
    konfidentialitetMotivering: sys.konfidentialitetMotivering ?? "",
    riktighet: sys.riktighet,
    riktighetMotivering: sys.riktighetMotivering ?? "",
    tillganglighet: sys.tillganglighet,
    tillganglighetMotivering: sys.tillganglighetMotivering ?? "",
    samhallsviktigt: sys.samhallsviktigt ?? false,
    samhallsviktigtMotivering: sys.samhallsviktigtMotivering ?? "",
  };
}

const ASPECTS = [
  {
    level: "konfidentialitet",
    motivering: "konfidentialitetMotivering",
    label: t.krt.confidentiality,
  },
  {
    level: "riktighet",
    motivering: "riktighetMotivering",
    label: t.krt.integrity,
  },
  {
    level: "tillganglighet",
    motivering: "tillganglighetMotivering",
    label: t.krt.availability,
  },
] as const;

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
  const [form, setForm] = useState<ClassificationForm>(EMPTY_FORM);
  const [step, setStep] = useState<0 | 1>(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (system) {
      setForm(systemToForm(system));
      setStep(0);
      setError("");
    }
  }, [system]);

  const update = <K extends keyof ClassificationForm>(
    field: K,
    value: ClassificationForm[K],
  ) => setForm((f) => ({ ...f, [field]: value }));

  const businessCritical = isBusinessCritical(
    form.riktighet,
    form.tillganglighet,
  );

  /** Nivåer och motiveringar — steg 1. */
  const validateLevels = (): boolean => {
    for (const aspect of ASPECTS) {
      if (!form[aspect.motivering].trim()) {
        setError(t.krt.motiveringRequired(aspect.label));
        return false;
      }
    }
    setError("");
    return true;
  };

  /**
   * Steg 1 leder vidare till samhällsviktighetsfrågan när klassningen gör
   * systemet verksamhetskritiskt — annars ställs den frågan aldrig och
   * formuläret sparas direkt.
   */
  const handlePrimary = () => {
    if (step === 0 && businessCritical) {
      if (validateLevels()) setStep(1);
      return;
    }
    void handleSave();
  };

  const handleSave = async () => {
    if (!system) return;

    if (!validateLevels()) {
      setStep(0);
      return;
    }
    // Motiveringen krävs oavsett ja eller nej — men bara när frågan ställts.
    if (businessCritical && !form.samhallsviktigtMotivering.trim()) {
      setError(t.krt.societalMotiveringRequired);
      return;
    }

    setSaving(true);
    setError("");
    try {
      const original = systemToForm(system);
      const body: Record<string, string | number | boolean> = {};
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
      onSave={handlePrimary}
      saving={saving}
      error={error}
      saveLabel={step === 0 && businessCritical ? t.next : t.save}
      onBack={step === 1 ? () => setStep(0) : undefined}
    >
      {step === 0 ? (
        <div className="flex flex-col gap-16">
          {/* En fieldset per aspekt — nivån och dess motivering hör ihop, och
              aspektnamnet i legend är rubriken över båda. */}
          {ASPECTS.map(({ level, motivering, label }) => (
            <Card key={level} color="tertiary">
              <Card.Body className="flex flex-col gap-12 w-full">
                <span className="text-large font-bold">{label}</span>
                <Field label={t.krt.level} required>
                  <KrtSelect
                    value={form[level]}
                    onChange={(v) => update(level, v)}
                  />
                </Field>
                <Field label={t.krt.motivering} required>
                  <Textarea
                    rows={2}
                    placeholder={t.krt.motiveringPlaceholder}
                    value={form[motivering]}
                    onChange={(e) => update(motivering, e.target.value)}
                    className="min-h-100"
                  />
                </Field>
              </Card.Body>
            </Card>
          ))}

          {businessCritical && (
            <p role="status" className="text-small">
              {t.krt.businessCriticalHit}
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-16">
          <p className="text-small">{t.krt.businessCriticalHit}</p>
          <Link href={t.krt.mcfUrl} external size="sm">
            {t.krt.mcfLinkLabel}
          </Link>

          <Card color="tertiary">
            <Card.Body className="flex flex-col gap-12 w-full">
              <span className="text-large font-bold">
                {t.krt.societalStepTitle}
              </span>
              <Field label={t.krt.societalQuestion} required>
                <RadioButton.Group
                  inline
                  name="samhallsviktigt"
                  value={form.samhallsviktigt ? "ja" : "nej"}
                >
                  <RadioButton
                    value="ja"
                    onChange={() => update("samhallsviktigt", true)}
                  >
                    {t.yes}
                  </RadioButton>
                  <RadioButton
                    value="nej"
                    onChange={() => update("samhallsviktigt", false)}
                  >
                    {t.no}
                  </RadioButton>
                </RadioButton.Group>
              </Field>
              {/* Motiveringen krävs oavsett svar — även ett nej ska gå att följa upp. */}
              <Field label={t.krt.societalMotivering} required>
                <Textarea
                  rows={3}
                  placeholder={t.krt.motiveringPlaceholder}
                  value={form.samhallsviktigtMotivering}
                  onChange={(e) =>
                    update("samhallsviktigtMotivering", e.target.value)
                  }
                  className="min-h-100"
                />
              </Field>
            </Card.Body>
          </Card>
        </div>
      )}
    </FormDialog>
  );
}
