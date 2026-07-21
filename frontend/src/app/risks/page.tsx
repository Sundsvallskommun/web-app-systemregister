"use client";

import { useState } from "react";
import { Button, Label, Table } from "@sk-web-gui/react";
import { Plus, Trash2 } from "lucide-react";
import AppShell from "@/components/AppShell";
import RiskFormDialog from "@/components/RiskFormDialog";
import EnumLabel from "@/components/EnumLabel";
import { useAuth } from "@/lib/auth";
import { useRisks } from "@/lib/riskStore";
import { RISK_LEVEL, RISK_STATUS } from "@/lib/enums";
import t from "@/lib/i18n";

export default function RisksPage() {
  const { auth } = useAuth();
  const { risks, setRisks } = useRisks();
  const [dialogOpen, setDialogOpen] = useState(false);
  const canEdit = auth?.role === "admin" || auth?.role === "editor";

  return (
    <AppShell>
      <div className="flex justify-between items-center mb-24">
        <h1 className="text-h2">{t.risks.title}</h1>
        {canEdit && (
          <Button
            variant="primary"
            leftIcon={<Plus />}
            onClick={() => setDialogOpen(true)}
          >
            {t.risks.newRisk}
          </Button>
        )}
      </div>

      <p className="mb-24">{t.risks.infoText}</p>

      <Table background scrollable="x">
        <Table.Header>
          <Table.HeaderColumn>{t.risks.risk}</Table.HeaderColumn>
          <Table.HeaderColumn>{t.risks.system}</Table.HeaderColumn>
          <Table.HeaderColumn>{t.risks.probability}</Table.HeaderColumn>
          <Table.HeaderColumn>{t.risks.impact}</Table.HeaderColumn>
          <Table.HeaderColumn>{t.status}</Table.HeaderColumn>
          <Table.HeaderColumn>{t.risks.responsible}</Table.HeaderColumn>
          <Table.HeaderColumn>{t.risks.deadline}</Table.HeaderColumn>
          {canEdit && (
            <Table.HeaderColumn className="justify-end">
              {t.actions}
            </Table.HeaderColumn>
          )}
        </Table.Header>
        <Table.Body>
          {risks.map((risk) => (
            <Table.Row key={risk.id}>
              <Table.Column>{risk.title}</Table.Column>
              <Table.Column>
                <Label color="tertiary">{risk.system}</Label>
              </Table.Column>
              <Table.Column>
                <EnumLabel value={risk.probability} map={RISK_LEVEL} />
              </Table.Column>
              <Table.Column>
                <EnumLabel value={risk.impact} map={RISK_LEVEL} />
              </Table.Column>
              <Table.Column>
                <EnumLabel value={risk.status} map={RISK_STATUS} />
              </Table.Column>
              <Table.Column>{risk.owner}</Table.Column>
              <Table.Column>{risk.dueDate}</Table.Column>
              {canEdit && (
                <Table.Column className="justify-end">
                  <Button
                    iconButton
                    size="sm"
                    variant="tertiary"
                    aria-label={t.a11y.delete(risk.title)}
                    onClick={() =>
                      setRisks(risks.filter((r) => r.id !== risk.id))
                    }
                  >
                    <Trash2 />
                  </Button>
                </Table.Column>
              )}
            </Table.Row>
          ))}
        </Table.Body>
      </Table>

      <RiskFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={(risk) => setRisks([...risks, risk])}
      />
    </AppShell>
  );
}
