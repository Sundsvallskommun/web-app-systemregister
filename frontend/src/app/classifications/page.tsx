"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Label, Link, Table } from "@sk-web-gui/react";
import { Eye, Pencil } from "lucide-react";
import AppShell from "@/components/AppShell";
import ClassificationFormDialog from "@/components/ClassificationFormDialog";
import ClassificationViewDialog from "@/components/ClassificationViewDialog";
import { KrtChip } from "@/components/KrtDisplay";
import { useAuth } from "@/lib/auth";
import { get } from "@/lib/api";
import type { System, PaginatedResponse } from "@/lib/api";
import { KRT_LEVEL_COLOR } from "@/lib/enums";
import { classLevel, isBusinessCritical } from "@/lib/krt";
import t from "@/lib/i18n";

export default function ClassificationsPage() {
  const { auth } = useAuth();
  const [systems, setSystems] = useState<System[]>([]);
  const [editing, setEditing] = useState<System | null>(null);
  const [viewing, setViewing] = useState<System | null>(null);

  const loadSystems = useCallback(() => {
    if (!auth) return;
    get<PaginatedResponse<System>>("/systems?limit=100")
      .then((res) => setSystems(res.data ?? []))
      .catch(() => {});
  }, [auth]);

  useEffect(() => {
    loadSystems();
  }, [loadSystems]);

  const canEdit = auth?.role === "admin" || auth?.role === "editor";

  return (
    <AppShell>
      <h1 className="text-h2 mb-24">{t.krt.title}</h1>

      <p className="mb-8">{t.krt.infoText}</p>

      <p className="mb-24">
        {t.krt.businessCriticalRule}{" "}
        <Link href={t.krt.mcfUrl} external>
          {t.krt.mcfLinkLabel}
        </Link>
      </p>

      <Table background scrollable="x">
        <Table.Header>
          <Table.HeaderColumn>{t.systems.systemId}</Table.HeaderColumn>
          <Table.HeaderColumn>{t.name}</Table.HeaderColumn>
          <Table.HeaderColumn>{t.owner}</Table.HeaderColumn>
          <Table.HeaderColumn className="justify-center">
            <span title={t.krt.confidentiality}>{t.krt.short.k}</span>
          </Table.HeaderColumn>
          <Table.HeaderColumn className="justify-center">
            <span title={t.krt.integrity}>{t.krt.short.r}</span>
          </Table.HeaderColumn>
          <Table.HeaderColumn className="justify-center">
            <span title={t.krt.availability}>{t.krt.short.t}</span>
          </Table.HeaderColumn>
          <Table.HeaderColumn>{t.krt.assessment}</Table.HeaderColumn>
          <Table.HeaderColumn>{t.krt.businessCritical}</Table.HeaderColumn>
          <Table.HeaderColumn>{t.systems.criticality}</Table.HeaderColumn>
          <Table.HeaderColumn className="justify-end" sticky={true}>
            {t.actions}
          </Table.HeaderColumn>
        </Table.Header>
        <Table.Body>
          {systems.map((sys) => {
            const cl = classLevel(
              sys.konfidentialitet,
              sys.riktighet,
              sys.tillganglighet,
            );
            const businessCritical = isBusinessCritical(
              sys.riktighet,
              sys.tillganglighet,
            );
            return (
              <Table.Row key={sys.id}>
                <Table.Column>
                  <Label color="tertiary" className="whitespace-nowrap">
                    {sys.systemId}
                  </Label>
                </Table.Column>
                <Table.Column>{sys.name}</Table.Column>
                <Table.Column>
                  {sys.ownerOrg?.name ?? t.emptyValue}
                </Table.Column>
                <Table.Column className="justify-center">
                  <KrtChip value={sys.konfidentialitet} />
                </Table.Column>
                <Table.Column className="justify-center">
                  <KrtChip value={sys.riktighet} />
                </Table.Column>
                <Table.Column className="justify-center">
                  <KrtChip value={sys.tillganglighet} />
                </Table.Column>
                <Table.Column data-cy="assessment">
                  <Label color={cl.color} className="whitespace-nowrap">
                    {cl.label}
                  </Label>
                </Table.Column>
                <Table.Column data-cy="business-critical">
                  <Label color={businessCritical ? "error" : "tertiary"}>
                    {businessCritical ? t.yes : t.no}
                  </Label>
                </Table.Column>
                <Table.Column>
                  {sys.CriticalityLevel ? (
                    <Label
                      color={
                        KRT_LEVEL_COLOR[sys.CriticalityLevel.level] ??
                        "tertiary"
                      }
                    >
                      {sys.CriticalityLevel.name}
                    </Label>
                  ) : (
                    t.emptyValue
                  )}
                </Table.Column>
                <Table.Column className="justify-end" sticky={true}>
                  <div className="inline-flex gap-4">
                    <Button
                      iconButton
                      variant="tertiary"
                      size="sm"
                      aria-label={t.a11y.view(sys.name)}
                      onClick={() => setViewing(sys)}
                    >
                      <Eye />
                    </Button>
                    {canEdit && (
                      <Button
                        iconButton
                        variant="tertiary"
                        size="sm"
                        aria-label={t.krt.a11yClassify(sys.name)}
                        onClick={() => setEditing(sys)}
                      >
                        <Pencil />
                      </Button>
                    )}
                  </div>
                </Table.Column>
              </Table.Row>
            );
          })}
          {systems.length === 0 && (
            <Table.Row>
              <Table.Column colSpan={10} className="justify-center py-32">
                {t.systems.noSystems}
              </Table.Column>
            </Table.Row>
          )}
        </Table.Body>
      </Table>

      <ClassificationViewDialog
        system={viewing}
        onClose={() => setViewing(null)}
      />

      <ClassificationFormDialog
        system={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          loadSystems();
        }}
      />
    </AppShell>
  );
}
