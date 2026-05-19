"use client";

import { useEffect, useState } from "react";
import {
  Typography, Box, Card, CardContent, CardActions, Button, Grid, Alert,
} from "@mui/material";
import { Description, Print, Download } from "@mui/icons-material";
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
    get<PaginatedResponse<System>>("/systems", auth.token).then((r) => setSystemCount(r.total ?? 0)).catch(() => {});
    get<PPB[]>("/gdpr", auth.token).then((r) => setPpbCount(r.length)).catch(() => {});
    get<AiApplication[]>("/ai", auth.token).then((r) => setAiCount(r.length)).catch(() => {});
  }, [auth]);

  const REPORTS = [
    { id: "1", title: t.reports.systemOverview, description: t.reports.systemOverviewDesc(systemCount), icon: <Description /> },
    { id: "2", title: t.reports.krtReport, description: t.reports.krtReportDesc, icon: <Description /> },
    { id: "3", title: t.reports.supplierReport, description: t.reports.supplierReportDesc, icon: <Description /> },
    { id: "4", title: t.reports.riskReport, description: t.reports.riskReportDesc, icon: <Description /> },
    { id: "5", title: t.reports.continuityReport, description: t.reports.continuityReportDesc, icon: <Description /> },
    { id: "6", title: t.reports.gdprReport, description: t.reports.gdprReportDesc(ppbCount), icon: <Description /> },
    { id: "7", title: t.reports.aiReport, description: t.reports.aiReportDesc(aiCount), icon: <Description /> },
  ];

  return (
    <AppShell>
      <Typography variant="h4" gutterBottom>{t.reports.title}</Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        {t.reports.infoText}
      </Alert>

      <Grid container spacing={3}>
        {REPORTS.map((report) => (
          <Grid key={report.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  {report.icon}
                  <Typography variant="h6">{report.title}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">{report.description}</Typography>
              </CardContent>
              <CardActions>
                <Button size="small" startIcon={<Print />}>{t.reports.print}</Button>
                <Button size="small" startIcon={<Download />}>{t.reports.export}</Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </AppShell>
  );
}
