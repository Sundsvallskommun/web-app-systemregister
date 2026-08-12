"use client";

import { useEffect, useState } from "react";
import { Button, Label, Table } from "@sk-web-gui/react";
import { Plus, Eye } from "lucide-react";
import AppShell from "@/components/AppShell";
import ViewDialog from "@/components/ViewDialog";
import EnumLabel from "@/components/EnumLabel";
import { useAuth } from "@/lib/auth";
import { get } from "@/lib/api";
import type { PPB } from "@/lib/api";
import { GDPR_STATUS, metaFor } from "@/lib/enums";
import t from "@/lib/i18n";

const legalBasisLabel = (value?: string) =>
  value ? (t.gdpr.legalBases[value.toLowerCase()] ?? value) : t.emptyValue;

const statusLabel = (value?: string) =>
  value ? metaFor(GDPR_STATUS, value).label : t.emptyValue;

const yesNo = (value?: boolean) => (value ? t.yes : t.no);

export default function GdprPage() {
  const { auth } = useAuth();
  const [treatments, setTreatments] = useState<PPB[]>([]);
  const [selected, setSelected] = useState<PPB | null>(null);

  useEffect(() => {
    if (!auth) return;
    get<PPB[]>("/gdpr")
      .then(setTreatments)
      .catch(() => {});
  }, [auth]);

  const canEdit = auth?.role === "admin" || auth?.role === "editor";

  return (
    <AppShell>
      <div className="flex xs:flex-col sm:flex-row xs:items-start sm:items-center justify-between mb-24">
        <h1 className="text-h2">{t.gdpr.title}</h1>
        {canEdit && (
          <Button variant="primary" leftIcon={<Plus />}>
            {t.gdpr.newTreatment}
          </Button>
        )}
      </div>

      <p className="mb-24">{t.gdpr.infoText}</p>

      <Table background scrollable="x">
        <Table.Header>
          <Table.HeaderColumn>{t.gdpr.treatmentId}</Table.HeaderColumn>
          <Table.HeaderColumn>{t.name}</Table.HeaderColumn>
          <Table.HeaderColumn>{t.status}</Table.HeaderColumn>
          <Table.HeaderColumn>{t.gdpr.legalBasis}</Table.HeaderColumn>
          <Table.HeaderColumn>{t.gdpr.sensitiveData}</Table.HeaderColumn>
          <Table.HeaderColumn>{t.gdpr.ssn}</Table.HeaderColumn>
          <Table.HeaderColumn>{t.gdpr.controller}</Table.HeaderColumn>
          <Table.HeaderColumn>{t.system}</Table.HeaderColumn>
          <Table.HeaderColumn className="justify-end" sticky={true}>
            {t.actions}
          </Table.HeaderColumn>
        </Table.Header>
        <Table.Body>
          {treatments.map((treatment) => (
            <Table.Row key={treatment.behandlingId}>
              <Table.Column>
                <Label color="tertiary" className="whitespace-nowrap">
                  {treatment.behandlingId}
                </Label>
              </Table.Column>
              <Table.Column>{treatment.name}</Table.Column>
              <Table.Column>
                <EnumLabel value={treatment.status} map={GDPR_STATUS} />
              </Table.Column>
              <Table.Column>
                {legalBasisLabel(treatment.legalBasis)}
              </Table.Column>
              <Table.Column>
                <Label
                  color={
                    treatment.processesSensitiveData ? "error" : "tertiary"
                  }
                >
                  {yesNo(treatment.processesSensitiveData)}
                </Label>
              </Table.Column>
              <Table.Column>
                <Label color={treatment.processesSsn ? "warning" : "tertiary"}>
                  {yesNo(treatment.processesSsn)}
                </Label>
              </Table.Column>
              <Table.Column>
                {treatment.controller?.name ?? t.emptyValue}
              </Table.Column>
              <Table.Column>
                {treatment.SystemModels?.length ? (
                  <div className="inline-flex flex-wrap gap-4">
                    {treatment.SystemModels.map((s) => (
                      <Label
                        key={s.id}
                        color="tertiary"
                        className="whitespace-nowrap"
                      >
                        {s.systemId}
                      </Label>
                    ))}
                  </div>
                ) : (
                  t.emptyValue
                )}
              </Table.Column>
              <Table.Column className="justify-end" sticky={true}>
                <Button
                  iconButton
                  size="sm"
                  variant="tertiary"
                  aria-label={t.a11y.view(treatment.name)}
                  onClick={() => setSelected(treatment)}
                >
                  <Eye />
                </Button>
              </Table.Column>
            </Table.Row>
          ))}
          {treatments.length === 0 && (
            <Table.Row>
              <Table.Column colSpan={9} className="justify-center py-32">
                {t.gdpr.noTreatments}
              </Table.Column>
            </Table.Row>
          )}
        </Table.Body>
      </Table>

      <ViewDialog
        open={!!selected}
        title={selected?.name ?? ""}
        onClose={() => setSelected(null)}
        maxWidth="md"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <p className="text-small">
            <strong>{t.gdpr.treatmentId}:</strong>{" "}
            {selected?.behandlingId ?? t.emptyValue}
          </p>
          <p className="text-small">
            <strong>{t.status}:</strong> {statusLabel(selected?.status)}
          </p>
          <p className="text-small">
            <strong>{t.gdpr.legalBasis}:</strong>{" "}
            {legalBasisLabel(selected?.legalBasis)}
          </p>
          <p className="text-small">
            <strong>{t.gdpr.controller}:</strong>{" "}
            {selected?.controller?.name ?? t.emptyValue}
          </p>
          <p className="text-small">
            <strong>{t.gdpr.dpo}:</strong>{" "}
            {selected?.dpo
              ? `${selected.dpo.firstName} ${selected.dpo.lastName}`
              : t.emptyValue}
          </p>
          <p className="text-small">
            <strong>{t.gdpr.dpiaRequired}:</strong>{" "}
            {yesNo(selected?.dpiaRequired)}
          </p>
          <p className="text-small">
            <strong>{t.gdpr.sensitiveData}:</strong>{" "}
            {yesNo(selected?.processesSensitiveData)}
          </p>
          <p className="text-small">
            <strong>{t.gdpr.thirdCountryTransfer}:</strong>{" "}
            {yesNo(selected?.transfersToThirdCountry)}
          </p>
        </div>
        <p className="text-small mt-16">
          <strong>{t.gdpr.purpose}:</strong>{" "}
          {selected?.purposeDescription ?? t.emptyValue}
        </p>
        <div className="mt-16">
          <p className="text-small font-bold mb-8">{t.gdpr.linkedSystems}</p>
          {selected?.SystemModels?.length ? (
            <div className="flex flex-wrap gap-4">
              {selected.SystemModels.map((s) => (
                <Label key={s.id} color="tertiary">
                  {s.systemId} — {s.name}
                </Label>
              ))}
            </div>
          ) : (
            <p className="text-small">{t.emptyValue}</p>
          )}
        </div>
      </ViewDialog>
    </AppShell>
  );
}
