"use client";

import { useEffect, useState } from "react";
import {
  Card,
  Link,
  ProgressStepper,
  RadioButton,
  Textarea,
} from "@sk-web-gui/react";
import { KrtChip, KrtSelect } from "@/components/KrtDisplay";
import Field from "@/components/Field";
import FormDialog from "@/components/FormDialog";
import { patch } from "@/lib/api";
import type { System } from "@/lib/api";
import { isBusinessCritical } from "@/lib/krt";
import t from "@/lib/i18n";
import { useScreenWidth } from "@/lib/hooks/useScreenWidth";

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

/** Ett steg per aspekt, i den ordning K/R/T alltid presenteras. */
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
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const screenWidth = useScreenWidth();

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

  // Samhällsviktighetssteget tillkommer först när klassningen gör systemet
  // verksamhetskritiskt, så antalet steg kan växa medan man fyller i.
  const stepLabels = [
    ...ASPECTS.map((a) => a.label),
    ...(businessCritical ? [t.krt.societalStepTitle] : []),
  ];
  const isLastStep = step === stepLabels.length - 1;

  /** Varje steg validerar bara sitt eget fält innan man går vidare. */
  const validateStep = (index: number): boolean => {
    const aspect = ASPECTS[index];
    if (aspect) {
      if (!form[aspect.level]) {
        setError(t.krt.levelRequired(aspect.label));
        return false;
      }
      if (!form[aspect.motivering].trim()) {
        setError(t.krt.motiveringRequired(aspect.label));
        return false;
      }
    } else if (!form.samhallsviktigtMotivering.trim()) {
      setError(t.krt.societalMotiveringRequired);
      return false;
    }
    setError("");
    return true;
  };

  const handlePrimary = () => {
    if (!validateStep(step)) return;
    if (!isLastStep) {
      setStep(step + 1);
      return;
    }
    void handleSave();
  };

  const handleSave = async () => {
    if (!system) return;

    // Sista steget kan nås direkt vid redigering — validera hela klassningen.
    for (let i = 0; i < stepLabels.length; i++) {
      if (!validateStep(i)) {
        setStep(i);
        return;
      }
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

      body.klassningsdatum = new Date().toLocaleDateString("sv-SE");

      await patch(`/systems/${system.id}`, body);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.saveFailed);
    } finally {
      setSaving(false);
    }
  };

  const currentAspect = ASPECTS[step];

  return (
    <FormDialog
      open={!!system}
      title={t.krt.classifyTitle(system?.systemId ?? "", system?.name ?? "")}
      onClose={onClose}
      onSave={handlePrimary}
      saving={saving}
      error={error}
      saveLabel={isLastStep ? t.save : t.next}
      onBack={step > 0 ? () => setStep(step - 1) : undefined}
    >
      <div className="flex flex-col gap-24">
        <div className="flex flex-col gap-8">
          <ProgressStepper
            steps={stepLabels}
            current={step}
            labelPosition="bottom"
            size="sm"
            vertical={screenWidth < 600}
          />
          <span className="text-small text-dark-secondary">
            {t.krt.stepOf(step + 1, stepLabels.length)}
          </span>
        </div>

        {/* Redan besvarade steg ligger kvar som läsbar sammanfattning, så man
            ser vad man valt tidigare utan att behöva backa. */}
        {step > 0 && (
          <div className="flex flex-col gap-8">
            {ASPECTS.slice(0, step).map(({ level, label }) => (
              <div key={level} className="flex flex-col gap-4">
                <div className="flex items-center gap-8">
                  <span className="text-small font-bold">{label}</span>
                  <KrtChip value={form[level]} />
                </div>
              </div>
            ))}
          </div>
        )}

        {currentAspect ? (
          <Card color="tertiary">
            <Card.Body className="flex w-full flex-col gap-12">
              <span className="text-large font-bold">
                {currentAspect.label}
              </span>
              <Field label={t.krt.level} required>
                <KrtSelect
                  value={form[currentAspect.level]}
                  onChange={(v) => update(currentAspect.level, v)}
                />
              </Field>
              <Field label={t.krt.motivering} required>
                <Textarea
                  rows={2}
                  placeholder={t.krt.motiveringPlaceholder}
                  value={form[currentAspect.motivering]}
                  onChange={(e) =>
                    update(currentAspect.motivering, e.target.value)
                  }
                  className="min-h-100"
                />
              </Field>
            </Card.Body>
          </Card>
        ) : (
          <>
            <p className="text-small">{t.krt.businessCriticalHit}</p>
            <Link href={t.krt.mcfUrl} external size="sm">
              {t.krt.mcfLinkLabel}
            </Link>

            <Card color="tertiary">
              <Card.Body className="flex w-full flex-col gap-12">
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
          </>
        )}
      </div>
    </FormDialog>
  );
}
