"use client";

import { useEffect, useState } from "react";
import {
  Typography,
  Box,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Alert,
  Tooltip,
} from "@mui/material";
import { Security } from "@mui/icons-material";
import AppShell from "@/components/AppShell";
import { KrtChip } from "@/components/KrtDisplay";
import { useAuth } from "@/lib/auth";
import { get } from "@/lib/api";
import type { System, PaginatedResponse } from "@/lib/api";
import t from "@/lib/i18n";

function classLevel(
  k: number,
  r: number,
  t_: number
): { label: string; color: "error" | "warning" | "info" | "success" } {
  const max = Math.max(k, r, t_);
  if (max >= 4) return { label: t.krt.levels.critical, color: "error" };
  if (max >= 3) return { label: t.krt.levels.high, color: "warning" };
  if (max >= 2) return { label: "Medium", color: "info" };
  return { label: t.krt.levels.low, color: "success" };
}

export default function ClassificationsPage() {
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
        <Security color='primary' />
        <Typography variant='h4'>{t.krt.title}</Typography>
      </Box>

      <Alert severity='info' sx={{ mb: 3 }}>
        {t.krt.infoText}
      </Alert>

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>System-ID</TableCell>
              <TableCell>Namn</TableCell>
              <TableCell>{t.owner}</TableCell>
              <TableCell align='center'>
                <Tooltip title='Konfidentialitet'>
                  <span>K</span>
                </Tooltip>
              </TableCell>
              <TableCell align='center'>
                <Tooltip title='Riktighet'>
                  <span>R</span>
                </Tooltip>
              </TableCell>
              <TableCell align='center'>
                <Tooltip title='Tillgänglighet'>
                  <span>T</span>
                </Tooltip>
              </TableCell>
              <TableCell>{t.krt.assessment}</TableCell>
              <TableCell>Kritikalitet</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {systems.map((sys) => {
              const cl = classLevel(
                sys.konfidentialitet,
                sys.riktighet,
                sys.tillganglighet
              );
              return (
                <TableRow key={sys.id} hover>
                  <TableCell>
                    <Chip
                      label={sys.systemId}
                      size='small'
                      variant='outlined'
                    />
                  </TableCell>
                  <TableCell>{sys.name}</TableCell>
                  <TableCell>{sys.ownerOrg?.name ?? "-"}</TableCell>
                  <TableCell align='center'>
                    <KrtChip value={sys.konfidentialitet} />
                  </TableCell>
                  <TableCell align='center'>
                    <KrtChip value={sys.riktighet} />
                  </TableCell>
                  <TableCell align='center'>
                    <KrtChip value={sys.tillganglighet} />
                  </TableCell>
                  <TableCell>
                    <Chip label={cl.label} size='small' color={cl.color} />
                  </TableCell>
                  <TableCell>
                    {sys.CriticalityLevel ? (
                      <Chip
                        label={sys.CriticalityLevel.name}
                        size='small'
                        sx={{
                          bgcolor: sys.CriticalityLevel.color,
                          color: "white",
                        }}
                      />
                    ) : (
                      "-"
                    )}
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
