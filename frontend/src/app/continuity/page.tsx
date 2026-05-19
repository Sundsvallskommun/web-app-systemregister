"use client";

import { useEffect, useState } from "react";
import {
  Typography, Box, Paper, Table, TableHead, TableRow, TableCell, TableBody,
  Chip, Alert,
} from "@mui/material";
import { Shield } from "@mui/icons-material";
import AppShell from "@/components/AppShell";
import { KrtChip } from "@/components/KrtDisplay";
import { useAuth } from "@/lib/auth";
import { get } from "@/lib/api";
import type { System, PaginatedResponse } from "@/lib/api";
import t from "@/lib/i18n";

function isCritical(k: number, r: number, tv: number): boolean {
  return Math.max(k, r, tv) >= 4;
}

function isSocietal(k: number, r: number, tv: number): boolean {
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
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
        <Shield color="primary" />
        <Typography variant="h4">{t.continuity.title}</Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        {t.continuity.infoText}
      </Alert>

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>System</TableCell>
              <TableCell>{t.owner}</TableCell>
              <TableCell align="center">K</TableCell>
              <TableCell align="center">R</TableCell>
              <TableCell align="center">T</TableCell>
              <TableCell>{t.continuity.businessCritical}</TableCell>
              <TableCell>{t.continuity.societalCritical}</TableCell>
              <TableCell>Kritikalitet</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {systems.map((sys) => {
              const critical = isCritical(sys.konfidentialitet, sys.riktighet, sys.tillganglighet);
              const societal = isSocietal(sys.konfidentialitet, sys.riktighet, sys.tillganglighet);
              return (
                <TableRow key={sys.id} hover sx={critical ? { bgcolor: "error.50" } : undefined}>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{sys.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{sys.systemId}</Typography>
                  </TableCell>
                  <TableCell>{sys.ownerOrg?.name ?? "-"}</TableCell>
                  <TableCell align="center"><KrtChip value={sys.konfidentialitet} /></TableCell>
                  <TableCell align="center"><KrtChip value={sys.riktighet} /></TableCell>
                  <TableCell align="center"><KrtChip value={sys.tillganglighet} /></TableCell>
                  <TableCell><Chip label={critical ? "Ja" : "Nej"} size="small" color={critical ? "error" : "default"} /></TableCell>
                  <TableCell><Chip label={societal ? "Ja" : "Nej"} size="small" color={societal ? "error" : "default"} /></TableCell>
                  <TableCell>
                    {sys.CriticalityLevel
                      ? <Chip label={sys.CriticalityLevel.name} size="small" sx={{ bgcolor: sys.CriticalityLevel.color, color: "white" }} />
                      : "-"
                    }
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Paper>
    </AppShell>
  );
}
