"use client";

import { useEffect, useState } from "react";
import {
  Typography, Box, Paper, Table, TableHead, TableRow, TableCell, TableBody,
  Chip, IconButton, Button, Alert,
} from "@mui/material";
import { SmartToy, Visibility, Add } from "@mui/icons-material";
import AppShell from "@/components/AppShell";
import ViewDialog from "@/components/ViewDialog";
import { useAuth } from "@/lib/auth";
import { get } from "@/lib/api";
import type { AiApplication } from "@/lib/api";
import t from "@/lib/i18n";

const STATUS_COLORS: Record<string, "success" | "warning" | "error" | "default" | "info"> = {
  active: "success", draft: "info", suspended: "warning", retired: "default",
};
const RISK_COLORS: Record<string, "error" | "warning" | "success"> = {
  high_risk: "error", limited_risk: "warning", minimal_risk: "success",
};
const RISK_LABELS = t.ai.riskCategories;

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
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <SmartToy color="primary" />
          <Typography variant="h4">{t.ai.title}</Typography>
        </Box>
        {canEdit && <Button variant="contained" startIcon={<Add />}>{t.ai.newApp}</Button>}
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>{t.ai.infoText}</Alert>

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>AI-ID</TableCell><TableCell>Namn</TableCell><TableCell>Status</TableCell>
              <TableCell>{t.ai.riskCategory}</TableCell><TableCell>{t.ai.fria}</TableCell><TableCell>System</TableCell>
              <TableCell>{t.owner}</TableCell><TableCell align="right">{t.actions}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {apps.map((app) => (
              <TableRow key={app.id} hover>
                <TableCell><Chip label={app.aiApplicationId} size="small" variant="outlined" /></TableCell>
                <TableCell>{app.name}</TableCell>
                <TableCell><Chip label={app.status} size="small" color={STATUS_COLORS[app.status] ?? "default"} /></TableCell>
                <TableCell>{app.riskCategory ? <Chip label={RISK_LABELS[app.riskCategory] ?? app.riskCategory} size="small" color={RISK_COLORS[app.riskCategory] ?? "default"} /> : "-"}</TableCell>
                <TableCell><Chip label={app.friaCompleted ? "Klar" : "Ej klar"} size="small" color={app.friaCompleted ? "success" : "warning"} /></TableCell>
                <TableCell>{app.SystemModel ? <Chip label={app.SystemModel.systemId} size="small" /> : "-"}</TableCell>
                <TableCell>{app.ownerOrg?.name ?? "-"}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => setSelected(app)}><Visibility /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <ViewDialog open={!!selected} title={selected?.name ?? ""} onClose={() => setSelected(null)} maxWidth="sm">
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
          <Typography variant="body2"><strong>AI-ID:</strong> {selected?.aiApplicationId}</Typography>
          <Typography variant="body2"><strong>Status:</strong> {selected?.status}</Typography>
          <Typography variant="body2"><strong>{t.ai.riskCategory}:</strong> {selected?.riskCategory ? RISK_LABELS[selected.riskCategory] ?? selected.riskCategory : "-"}</Typography>
          <Typography variant="body2"><strong>{t.ai.highRiskArea}:</strong> {selected?.highRiskArea ?? "-"}</Typography>
          <Typography variant="body2"><strong>{t.ai.friaCompleted}:</strong> {selected?.friaCompleted ? "Ja" : "Nej"}</Typography>
          <Typography variant="body2"><strong>{t.ai.registrationStatus}:</strong> {selected?.registrationStatus}</Typography>
          <Typography variant="body2"><strong>System:</strong> {selected?.SystemModel ? `${selected.SystemModel.systemId} - ${selected.SystemModel.name}` : "-"}</Typography>
          <Typography variant="body2"><strong>{t.owner}:</strong> {selected?.ownerOrg?.name ?? "-"}</Typography>
          <Typography variant="body2"><strong>{t.ai.contact}:</strong> {selected?.contact ? `${selected.contact.firstName} ${selected.contact.lastName}` : "-"}</Typography>
        </Box>
        <Typography variant="body2" sx={{ mt: 2 }}><strong>Beskrivning:</strong> {selected?.description ?? "-"}</Typography>
      </ViewDialog>
    </AppShell>
  );
}
