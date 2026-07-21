"use client";

import { useEffect, useState } from "react";
import { Label, Table } from "@sk-web-gui/react";
import AppShell from "@/components/AppShell";
import { KrtChip } from "@/components/KrtDisplay";
import { useAuth } from "@/lib/auth";
import { get } from "@/lib/api";
import type { System, PaginatedResponse } from "@/lib/api";
import { KRT_LEVEL_COLOR } from "@/lib/enums";
import t from "@/lib/i18n";

function isCritical(k: number, r: number, tv: number): boolean {
  return Math.max(k, r, tv) >= 4;
}

function isSocietal(k: number, tv: number): boolean {
  return k >= 4 && tv >= 4;
}

export default function ContinuityPage() {
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
      <h1 className="text-h2 mb-24">{t.continuity.title}</h1>

      <p className="mb-24">{t.continuity.infoText}</p>

      <Table background scrollable="x">
        <Table.Header>
          <Table.HeaderColumn>{t.system}</Table.HeaderColumn>
          <Table.HeaderColumn>{t.owner}</Table.HeaderColumn>
          <Table.HeaderColumn className="justify-center">
            {t.krt.short.k}
          </Table.HeaderColumn>
          <Table.HeaderColumn className="justify-center">
            {t.krt.short.r}
          </Table.HeaderColumn>
          <Table.HeaderColumn className="justify-center">
            {t.krt.short.t}
          </Table.HeaderColumn>
          <Table.HeaderColumn>
            {t.continuity.businessCritical}
          </Table.HeaderColumn>
          <Table.HeaderColumn>
            {t.continuity.societalCritical}
          </Table.HeaderColumn>
          <Table.HeaderColumn>{t.systems.criticality}</Table.HeaderColumn>
        </Table.Header>
        <Table.Body>
          {systems.map((sys) => {
            const critical = isCritical(
              sys.konfidentialitet,
              sys.riktighet,
              sys.tillganglighet,
            );
            const societal = isSocietal(
              sys.konfidentialitet,
              sys.tillganglighet,
            );
            return (
              <Table.Row key={sys.id}>
                <Table.Column>
                  <div className="flex flex-col">
                    <span className="font-bold">{sys.name}</span>
                    <span className="text-small text-dark-secondary">
                      {sys.systemId}
                    </span>
                  </div>
                </Table.Column>
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
                <Table.Column>
                  <Label color={critical ? "error" : "tertiary"}>
                    {critical ? t.yes : t.no}
                  </Label>
                </Table.Column>
                <Table.Column>
                  <Label color={societal ? "error" : "tertiary"}>
                    {societal ? t.yes : t.no}
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
