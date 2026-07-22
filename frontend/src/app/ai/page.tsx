"use client";

import { useEffect, useState } from "react";
import { Button, Label, Table } from "@sk-web-gui/react";
import { Plus, Eye } from "lucide-react";
import AppShell from "@/components/AppShell";
import ViewDialog from "@/components/ViewDialog";
import EnumLabel from "@/components/EnumLabel";
import { useAuth } from "@/lib/auth";
import { get } from "@/lib/api";
import type { AiApplication } from "@/lib/api";
import { AI_STATUS, AI_RISK_CATEGORY, metaFor } from "@/lib/enums";
import t from "@/lib/i18n";

const yesNo = (value?: boolean) => (value ? t.yes : t.no);

const statusLabel = (value?: string) =>
  value ? metaFor(AI_STATUS, value).label : t.emptyValue;

const riskCategoryLabel = (value?: string) =>
  value ? metaFor(AI_RISK_CATEGORY, value).label : t.emptyValue;

const registrationStatusLabel = (value?: string) =>
  value
    ? t.ai.registrationStatuses[value.toLowerCase()] ?? value
    : t.emptyValue;

const highRiskAreaLabel = (value?: string) =>
  value ? t.ai.highRiskAreas[value.toLowerCase()] ?? value : t.emptyValue;

export default function AiPage() {
  const { auth } = useAuth();
  const [apps, setApps] = useState<AiApplication[]>([]);
  const [selected, setSelected] = useState<AiApplication | null>(null);

  useEffect(() => {
    if (!auth) return;
    get<AiApplication[]>("/ai", auth.token).then(setApps).catch(() => {});
  }, [auth]);

  const canEdit = auth?.role === "admin" || auth?.role === "editor";

  return (
    <AppShell>
      <div className="flex xs:flex-col sm:flex-row xs:items-start sm:items-center justify-between mb-24">
        <h1 className="text-h2">{t.ai.title}</h1>
        {canEdit && (
          <Button variant="primary" leftIcon={<Plus />}>
            {t.ai.newApp}
          </Button>
        )}
      </div>

      <p className="mb-24">{t.ai.infoText}</p>

      <Table background scrollable="x">
        <Table.Header>
          <Table.HeaderColumn>{t.ai.appId}</Table.HeaderColumn>
          <Table.HeaderColumn>{t.name}</Table.HeaderColumn>
          <Table.HeaderColumn>{t.status}</Table.HeaderColumn>
          <Table.HeaderColumn>{t.ai.riskCategory}</Table.HeaderColumn>
          <Table.HeaderColumn>{t.ai.fria}</Table.HeaderColumn>
          <Table.HeaderColumn>{t.system}</Table.HeaderColumn>
          <Table.HeaderColumn>{t.owner}</Table.HeaderColumn>
          <Table.HeaderColumn className="justify-end">
            {t.actions}
          </Table.HeaderColumn>
        </Table.Header>
        <Table.Body>
          {apps.map((app) => (
            <Table.Row key={app.aiApplicationId}>
              <Table.Column>
                <Label color="tertiary" className="whitespace-nowrap">{app.aiApplicationId}</Label>
              </Table.Column>
              <Table.Column>{app.name}</Table.Column>
              <Table.Column>
                <EnumLabel value={app.status} map={AI_STATUS} />
              </Table.Column>
              <Table.Column>
                {app.riskCategory ? (
                  <EnumLabel value={app.riskCategory} map={AI_RISK_CATEGORY} />
                ) : (
                  t.emptyValue
                )}
              </Table.Column>
              <Table.Column>
                <Label color={app.friaCompleted ? "success" : "warning"} className="whitespace-nowrap">
                  {app.friaCompleted ? t.ai.friaDone : t.ai.friaNotDone}
                </Label>
              </Table.Column>
              <Table.Column>
                {app.SystemModel ? (
                  <Label color="tertiary" className="whitespace-nowrap">{app.SystemModel.systemId}</Label>
                ) : (
                  t.emptyValue
                )}
              </Table.Column>
              <Table.Column>{app.ownerOrg?.name ?? t.emptyValue}</Table.Column>
              <Table.Column className="justify-end">
                <Button
                  iconButton
                  size="sm"
                  variant="tertiary"
                  aria-label={t.a11y.view(app.name)}
                  onClick={() => setSelected(app)}
                >
                  <Eye />
                </Button>
              </Table.Column>
            </Table.Row>
          ))}
          {apps.length === 0 && (
            <Table.Row>
              <Table.Column colSpan={8} className="justify-center py-32">
                {t.ai.noApps}
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
            <strong>{t.ai.appId}:</strong> {selected?.aiApplicationId}
          </p>
          <p className="text-small">
            <strong>{t.status}:</strong> {statusLabel(selected?.status)}
          </p>
          <p className="text-small">
            <strong>{t.ai.riskCategory}:</strong>{" "}
            {riskCategoryLabel(selected?.riskCategory)}
          </p>
          <p className="text-small">
            <strong>{t.ai.highRiskArea}:</strong>{" "}
            {highRiskAreaLabel(selected?.highRiskArea)}
          </p>
          <p className="text-small">
            <strong>{t.ai.friaCompleted}:</strong>{" "}
            {yesNo(selected?.friaCompleted)}
          </p>
          <p className="text-small">
            <strong>{t.ai.registrationStatus}:</strong>{" "}
            {registrationStatusLabel(selected?.registrationStatus)}
          </p>
          <p className="text-small">
            <strong>{t.system}:</strong>{" "}
            {selected?.SystemModel
              ? `${selected.SystemModel.systemId} — ${selected.SystemModel.name}`
              : t.emptyValue}
          </p>
          <p className="text-small">
            <strong>{t.owner}:</strong> {selected?.ownerOrg?.name ?? t.emptyValue}
          </p>
          <p className="text-small">
            <strong>{t.ai.contact}:</strong>{" "}
            {selected?.contact
              ? `${selected.contact.firstName} ${selected.contact.lastName}`
              : t.emptyValue}
          </p>
        </div>
        <p className="text-small mt-16">
          <strong>{t.description}:</strong>{" "}
          {selected?.description ?? t.emptyValue}
        </p>
      </ViewDialog>
    </AppShell>
  );
}
