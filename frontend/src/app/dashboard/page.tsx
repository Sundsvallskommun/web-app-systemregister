"use client";

import { useEffect, useState } from "react";
import { Label, MetaCard, Table } from "@sk-web-gui/react";
import { Server, Building2, FileText, Bot } from "lucide-react";
import AppShell from "@/components/AppShell";
import EnumLabel from "@/components/EnumLabel";
import { KrtChip } from "@/components/KrtDisplay";
import { useAuth } from "@/lib/auth";
import { get } from "@/lib/api";
import type { System, PaginatedResponse, PPB, AiApplication } from "@/lib/api";
import { SYSTEM_STATUS } from "@/lib/enums";
import t from "@/lib/i18n";

export default function DashboardPage() {
  const { auth } = useAuth();
  const [systemCount, setSystemCount] = useState(0);
  const [orgCount, setOrgCount] = useState(0);
  const [ppbCount, setPpbCount] = useState(0);
  const [aiCount, setAiCount] = useState(0);
  const [recentSystems, setRecentSystems] = useState<System[]>([]);

  useEffect(() => {
    if (!auth) return;
    get<PaginatedResponse<System>>("/systems", auth.token)
      .then((res) => {
        setSystemCount(res.total ?? res.data?.length ?? 0);
        setRecentSystems((res.data ?? []).slice(0, 5));
      })
      .catch(() => {});
    get<{ id: string }[]>("/organizations", auth.token)
      .then((res) => setOrgCount(res.length))
      .catch(() => {});
    get<PPB[]>("/gdpr", auth.token)
      .then((res) => setPpbCount(res.length))
      .catch(() => {});
    get<AiApplication[]>("/ai", auth.token)
      .then((res) => setAiCount(res.length))
      .catch(() => {});
  }, [auth]);

  if (!auth) return null;

  const cards = [
    { label: t.systems.title, value: systemCount, icon: <Server /> },
    { label: t.dashboard.organizations, value: orgCount, icon: <Building2 /> },
    { label: t.gdpr.title, value: ppbCount, icon: <FileText /> },
    { label: t.ai.title, value: aiCount, icon: <Bot /> },
  ];

  return (
    <AppShell>
      <div className="mb-24 flex flex-col gap-8">
        <h1 className="text-h2">{t.dashboard.title}</h1>
        <div>
          <Label color="info">{t.roleDashboards[auth.role]}</Label>
        </div>
      </div>

      <div className="mb-32 grid gap-16 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <MetaCard key={c.label} color="vattjom" icon={c.icon}>
            <MetaCard.Header>
              <span className="text-h3">{c.value}</span>
            </MetaCard.Header>
            <MetaCard.Text>{c.label}</MetaCard.Text>
          </MetaCard>
        ))}
      </div>

      <h2 className="text-h3 mb-16">{t.dashboard.recentSystems}</h2>
      <Table background scrollable="x">
        <Table.Header>
          <Table.HeaderColumn>{t.systems.systemId}</Table.HeaderColumn>
          <Table.HeaderColumn>{t.name}</Table.HeaderColumn>
          <Table.HeaderColumn>{t.status}</Table.HeaderColumn>
          <Table.HeaderColumn>{t.owner}</Table.HeaderColumn>
          <Table.HeaderColumn className="justify-center" sticky={true}>
            {t.krt.abbr}
          </Table.HeaderColumn>
        </Table.Header>
        <Table.Body>
          {recentSystems.map((sys) => (
            <Table.Row key={sys.id}>
              <Table.Column>
                <Label color="tertiary" className="whitespace-nowrap">
                  {sys.systemId}
                </Label>
              </Table.Column>
              <Table.Column>{sys.name}</Table.Column>
              <Table.Column>
                <EnumLabel value={sys.status} map={SYSTEM_STATUS} />
              </Table.Column>
              <Table.Column>{sys.ownerOrg?.name ?? t.emptyValue}</Table.Column>
              <Table.Column className="justify-center" sticky={true}>
                <div className="inline-flex gap-4">
                  <KrtChip value={sys.konfidentialitet} />
                  <KrtChip value={sys.riktighet} />
                  <KrtChip value={sys.tillganglighet} />
                </div>
              </Table.Column>
            </Table.Row>
          ))}
          {recentSystems.length === 0 && (
            <Table.Row>
              <Table.Column colSpan={5} className="justify-center py-32">
                {t.systems.noSystems}
              </Table.Column>
            </Table.Row>
          )}
        </Table.Body>
      </Table>
    </AppShell>
  );
}
