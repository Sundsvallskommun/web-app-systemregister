"use client";

import { useEffect, useState } from "react";
import {
  Typography, Box, Paper, Table, TableHead, TableRow, TableCell, TableBody,
  Chip, Alert,
} from "@mui/material";
import { AccountTree } from "@mui/icons-material";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { get } from "@/lib/api";
import type { System, PaginatedResponse } from "@/lib/api";
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
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
        <AccountTree color="primary" />
        <Typography variant="h4">{t.processes.title}</Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        {t.processes.infoText}
      </Alert>

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>System-ID</TableCell>
              <TableCell>System</TableCell>
              <TableCell>{t.processes.ownerOrg}</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>K/R/T</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {systems.map((s) => (
              <TableRow key={s.id} hover>
                <TableCell><Chip label={s.systemId} size="small" variant="outlined" /></TableCell>
                <TableCell>{s.name}</TableCell>
                <TableCell>{s.ownerOrg?.name ?? "-"}</TableCell>
                <TableCell><Chip label={s.status} size="small" color={s.status === "production" ? "success" : "default"} /></TableCell>
                <TableCell>{s.konfidentialitet}/{s.riktighet}/{s.tillganglighet}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Alert severity="warning" sx={{ mt: 3 }}>
        {t.processes.klassaNote}
      </Alert>
    </AppShell>
  );
}
