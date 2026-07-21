"use client";

import { useEffect, useState } from "react";
import { Label, Table } from "@sk-web-gui/react";
import AppShell from "@/components/AppShell";
import { KrtChip } from "@/components/KrtDisplay";
import { useAuth } from "@/lib/auth";
import { get } from "@/lib/api";
import type { System, PaginatedResponse } from "@/lib/api";
import { KRT_LEVEL_COLOR, type SemanticColor } from "@/lib/enums";
import t from "@/lib/i18n";

function classLevel(
  k: number,
  r: number,
  t_: number
): { label: string; color: SemanticColor } {
  const max = Math.max(k, r, t_);
  if (max >= 4) return { label: t.krt.levels.critical, color: "error" };
  if (max >= 3) return { label: t.krt.levels.high, color: "warning" };
  if (max >= 2) return { label: t.krt.levels.medium, color: "info" };
  return { label: t.krt.levels.low, color: "success" };
}

export default function ClassificationsPage() {
  const { auth } = useAuth();
  const [systems, setSystems] = useState<System[]>([]);

  useEffect(() => {
    if (!auth) return;
    get<PaginatedResponse<System>>("/systems?limit=100", auth.token)
      .then((res) => setSystems(res.data ?? []))
      .catch(() => {});
  }, [auth]);

  return (
    <AppShell>
      <h1 className="text-h2 mb-24">{t.krt.title}</h1>

      <p className="mb-24">{t.krt.infoText}</p>

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
          <Table.HeaderColumn>{t.systems.criticality}</Table.HeaderColumn>
        </Table.Header>
        <Table.Body>
          {systems.map((sys) => {
            const cl = classLevel(
              sys.konfidentialitet,
              sys.riktighet,
              sys.tillganglighet
            );
            return (
              <Table.Row key={sys.id}>
                <Table.Column>
                  <Label color="tertiary">{sys.systemId}</Label>
                </Table.Column>
                <Table.Column>{sys.name}</Table.Column>
                <Table.Column>{sys.ownerOrg?.name ?? t.emptyValue}</Table.Column>
                <Table.Column className="justify-center">
                  <KrtChip value={sys.konfidentialitet} />
                </Table.Column>
                <Table.Column className="justify-center">
                  <KrtChip value={sys.riktighet} />
                </Table.Column>
                <Table.Column className="justify-center">
                  <KrtChip value={sys.tillganglighet} />
                </Table.Column>
                <Table.Column>
                  <Label color={cl.color}>{cl.label}</Label>
                </Table.Column>
                <Table.Column>
                  {sys.CriticalityLevel ? (
                    <Label
                      color={
                        KRT_LEVEL_COLOR[sys.CriticalityLevel.level] ?? "tertiary"
                      }
                    >
                      {sys.CriticalityLevel.name}
                    </Label>
                  ) : (
                    t.emptyValue
                  )}
                </Table.Column>
              </Table.Row>
            );
          })}
          {systems.length === 0 && (
            <Table.Row>
              <Table.Column colSpan={8} className="justify-center py-32">
                {t.systems.noSystems}
              </Table.Column>
            </Table.Row>
          )}
        </Table.Body>
      </Table>
    </AppShell>
  );
}
