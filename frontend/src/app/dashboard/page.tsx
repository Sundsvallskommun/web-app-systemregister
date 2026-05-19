"use client";

import { useEffect, useState } from "react";
import { Grid, Card, CardContent, Typography, Box, Chip, Paper, Table, TableHead, TableRow, TableCell, TableBody } from "@mui/material";
import { Dns, Business, Warning, Security, Description, SmartToy } from "@mui/icons-material";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { get } from "@/lib/api";
import type { System, PaginatedResponse, PPB, AiApplication } from "@/lib/api";
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
      .then((res) => { setSystemCount(res.total ?? res.data?.length ?? 0); setRecentSystems((res.data ?? []).slice(0, 5)); })
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
    { label: "System", value: systemCount, icon: <Dns fontSize="large" />, color: "#3B82F6" },
    { label: "Organisationer", value: orgCount, icon: <Business fontSize="large" />, color: "#10B981" },
    { label: "GDPR-behandlingar", value: ppbCount, icon: <Description fontSize="large" />, color: "#F59E0B" },
    { label: t.nav.ai, value: aiCount, icon: <SmartToy fontSize="large" />, color: "#8B5CF6" },
  ];

  return (
    <AppShell>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>Dashboard</Typography>
        <Chip label={t.roleDashboards[auth.role]} color="info" variant="outlined" />
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {cards.map((c) => (
          <Grid key={c.label} size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box sx={{ bgcolor: c.color + "20", color: c.color, borderRadius: 2, p: 1.5, display: "flex" }}>
                  {c.icon}
                </Box>
                <Box>
                  <Typography variant="h4">{c.value}</Typography>
                  <Typography variant="body2" color="text.secondary">{c.label}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Typography variant="h5" gutterBottom>Senaste system</Typography>
      <Paper>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>System-ID</TableCell>
              <TableCell>Namn</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>{t.owner}</TableCell>
              <TableCell align="center">K/R/T</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {recentSystems.map((s) => (
              <TableRow key={s.id} hover>
                <TableCell><Chip label={s.systemId} size="small" variant="outlined" /></TableCell>
                <TableCell>{s.name}</TableCell>
                <TableCell><Chip label={s.status} size="small" color={s.status === "production" ? "success" : "default"} /></TableCell>
                <TableCell>{s.ownerOrg?.name ?? "-"}</TableCell>
                <TableCell align="center">{s.konfidentialitet}/{s.riktighet}/{s.tillganglighet}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </AppShell>
  );
}
