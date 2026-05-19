"use client";

import { useState } from "react";
import {
  Typography, Box, Paper, Table, TableHead, TableRow, TableCell, TableBody,
  Chip, Button, Alert, IconButton,
} from "@mui/material";
import { Add, Warning, Delete } from "@mui/icons-material";
import AppShell from "@/components/AppShell";
import RiskFormDialog from "@/components/RiskFormDialog";
import { useAuth } from "@/lib/auth";
import { useRisks, type Risk } from "@/lib/riskStore";
import t from "@/lib/i18n";

const LEVEL_COLORS: Record<string, "success" | "warning" | "error" | "info"> = {
  low: "success", medium: "info", high: "warning", critical: "error",
};
const STATUS_COLORS: Record<string, "success" | "warning" | "error" | "default"> = {
  open: "error", mitigated: "success", accepted: "warning", closed: "default",
};

export default function RisksPage() {
  const { auth } = useAuth();
  const { risks, setRisks } = useRisks();
  const [dialogOpen, setDialogOpen] = useState(false);
  const canEdit = auth?.role === "admin" || auth?.role === "editor";

  return (
    <AppShell>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Warning color="warning" />
          <Typography variant="h4">{t.risks.title}</Typography>
        </Box>
        {canEdit && <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}>{t.risks.newRisk}</Button>}
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>{t.risks.infoText}</Alert>

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Risk</TableCell><TableCell>System</TableCell><TableCell>{t.risks.probability}</TableCell>
              <TableCell>{t.risks.impact}</TableCell><TableCell>Status</TableCell><TableCell>{t.risks.responsible}</TableCell>
              <TableCell>{t.risks.deadline}</TableCell>{canEdit && <TableCell align="right">{t.actions}</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {risks.map((risk) => (
              <TableRow key={risk.id} hover>
                <TableCell>{risk.title}</TableCell>
                <TableCell><Chip label={risk.system} size="small" variant="outlined" /></TableCell>
                <TableCell><Chip label={risk.probability} size="small" color={LEVEL_COLORS[risk.probability]} /></TableCell>
                <TableCell><Chip label={risk.impact} size="small" color={LEVEL_COLORS[risk.impact]} /></TableCell>
                <TableCell><Chip label={risk.status} size="small" color={STATUS_COLORS[risk.status]} /></TableCell>
                <TableCell>{risk.owner}</TableCell>
                <TableCell>{risk.dueDate}</TableCell>
                {canEdit && (
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => setRisks(risks.filter((r) => r.id !== risk.id))}><Delete /></IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <RiskFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSave={(risk) => setRisks([...risks, risk])} />
    </AppShell>
  );
}
