"use client";

import { useEffect, useState } from "react";
import { Label, Table } from "@sk-web-gui/react";
import AppShell from "@/components/AppShell";
import EnumLabel from "@/components/EnumLabel";
import { KrtChip } from "@/components/KrtDisplay";
import { useAuth } from "@/lib/auth";
import { get } from "@/lib/api";
import type { System, PaginatedResponse } from "@/lib/api";
import { SYSTEM_STATUS } from "@/lib/enums";
import t from "@/lib/i18n";

export default function ProcessesPage() {
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
      <h1 className="text-h2 mb-24">{t.processes.title}</h1>

      <p className="mb-24">{t.processes.infoText}</p>

      <Table background scrollable="x">
        <Table.Header>
          <Table.HeaderColumn>{t.systems.systemId}</Table.HeaderColumn>
          <Table.HeaderColumn>{t.system}</Table.HeaderColumn>
          <Table.HeaderColumn>{t.processes.ownerOrg}</Table.HeaderColumn>
          <Table.HeaderColumn>{t.status}</Table.HeaderColumn>
          <Table.HeaderColumn className="justify-center" sticky={true}>
            {t.krt.abbr}
          </Table.HeaderColumn>
        </Table.Header>
        <Table.Body>
          {systems.map((sys) => (
            <Table.Row key={sys.id}>
              <Table.Column>
                <Label color="tertiary" className="whitespace-nowrap">
                  {sys.systemId}
                </Label>
              </Table.Column>
              <Table.Column>{sys.name}</Table.Column>
              <Table.Column>{sys.ownerOrg?.name ?? t.emptyValue}</Table.Column>
              <Table.Column>
                <EnumLabel value={sys.status} map={SYSTEM_STATUS} />
              </Table.Column>
              <Table.Column className="justify-center" sticky={true}>
                <div className="inline-flex gap-4">
                  <KrtChip value={sys.konfidentialitet} />
                  <KrtChip value={sys.riktighet} />
                  <KrtChip value={sys.tillganglighet} />
                </div>
              </Table.Column>
            </Table.Row>
          ))}
          {systems.length === 0 && (
            <Table.Row>
              <Table.Column colSpan={5} className="justify-center py-32">
                {t.systems.noSystems}
              </Table.Column>
            </Table.Row>
          )}
        </Table.Body>
      </Table>

      <p className="mt-24">{t.processes.klassaNote}</p>
    </AppShell>
  );
}
