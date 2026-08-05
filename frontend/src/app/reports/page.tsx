"use client";

import { useEffect, useState } from "react";
import { Button, Card } from "@sk-web-gui/react";
import { Printer, Download } from "lucide-react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { get } from "@/lib/api";
import type { System, PaginatedResponse, PPB, AiApplication } from "@/lib/api";
import t from "@/lib/i18n";

export default function ReportsPage() {
  const { auth } = useAuth();
  const [systemCount, setSystemCount] = useState(0);
  const [ppbCount, setPpbCount] = useState(0);
  const [aiCount, setAiCount] = useState(0);

  useEffect(() => {
    if (!auth) return;
    get<PaginatedResponse<System>>("/systems")
      .then((r) => setSystemCount(r.total ?? 0))
      .catch(() => {});
    get<PPB[]>("/gdpr")
      .then((r) => setPpbCount(r.length))
      .catch(() => {});
    get<AiApplication[]>("/ai")
      .then((r) => setAiCount(r.length))
      .catch(() => {});
  }, [auth]);

  const reports = [
    {
      id: "1",
      title: t.reports.systemOverview,
      description: t.reports.systemOverviewDesc(systemCount),
    },
    {
      id: "2",
      title: t.reports.krtReport,
      description: t.reports.krtReportDesc,
    },
    {
      id: "3",
      title: t.reports.supplierReport,
      description: t.reports.supplierReportDesc,
    },
    {
      id: "4",
      title: t.reports.riskReport,
      description: t.reports.riskReportDesc,
    },
    {
      id: "5",
      title: t.reports.continuityReport,
      description: t.reports.continuityReportDesc,
    },
    {
      id: "6",
      title: t.reports.gdprReport,
      description: t.reports.gdprReportDesc(ppbCount),
    },
    {
      id: "7",
      title: t.reports.aiReport,
      description: t.reports.aiReportDesc(aiCount),
    },
  ];

  return (
    <AppShell>
      <h1 className="text-h2 mb-24">{t.reports.title}</h1>

      <p className="mb-24">{t.reports.infoText}</p>

      <div className="grid gap-16 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        {reports.map((report) => (
          <Card key={report.id} color="mono">
            <Card.Body>
              <Card.Header>
                <h2>{report.title}</h2>
              </Card.Header>
              <Card.Text>
                <p>{report.description}</p>
              </Card.Text>
              <div className="mt-16 flex flex-wrap gap-8">
                <Button size="sm" variant="tertiary" leftIcon={<Printer />}>
                  {t.reports.print}
                </Button>
                <Button size="sm" variant="tertiary" leftIcon={<Download />}>
                  {t.reports.export}
                </Button>
              </div>
            </Card.Body>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
