"use client";

import { useEffect, useState, useCallback } from "react";
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
  IconButton,
  TextField,
  InputAdornment,
  Button,
} from "@mui/material";
import { Search, Add, Edit, Visibility } from "@mui/icons-material";
import AppShell from "@/components/AppShell";
import { KrtChip } from "@/components/KrtDisplay";
import ViewDialog from "@/components/ViewDialog";
import SystemFormDialog from "@/components/SystemFormDialog";
import { useAuth } from "@/lib/auth";
import { useRisks } from "@/lib/riskStore";
import { get } from "@/lib/api";
import type { System, PaginatedResponse } from "@/lib/api";
import t from "@/lib/i18n";

const STATUS_COLORS: Record<
  string,
  "success" | "warning" | "error" | "default" | "info"
> = {
  production: "success",
  development: "info",
  planned: "warning",
  deprecated: "error",
  retired: "default",
};

export default function SystemsPage() {
  const { auth } = useAuth();
  const { risks } = useRisks();
  const [systems, setSystems] = useState<System[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<System | null>(null);
  const [dialogMode, setDialogMode] = useState<"closed" | "create" | "edit">(
    "closed"
  );
  const [dialogSystem, setDialogSystem] = useState<System | null>(null);

  const loadSystems = useCallback(() => {
    if (!auth) return;
    get<PaginatedResponse<System>>("/systems?limit=100", auth.token)
      .then((res) => setSystems(res.data ?? []))
      .catch(() => {});
  }, [auth]);

  useEffect(() => {
    loadSystems();
  }, [loadSystems]);

  const canEdit = auth?.role === "admin" || auth?.role === "editor";

  const filtered = systems.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.systemId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant='h4'>System</Typography>
        {canEdit && (
          <Button
            variant='contained'
            startIcon={<Add />}
            onClick={() => {
              setDialogSystem(null);
              setDialogMode("create");
            }}
          >
            Nytt system
          </Button>
        )}
      </Box>

      <TextField
        placeholder={t.systems.searchPlaceholder}
        size='small'
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2, width: 300 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position='start'>
                <Search />
              </InputAdornment>
            ),
          },
        }}
      />

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>System-ID</TableCell>
              <TableCell>Namn</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Hosting</TableCell>
              <TableCell>{t.owner}</TableCell>
              <TableCell align='center'>K</TableCell>
              <TableCell align='center'>R</TableCell>
              <TableCell align='center'>T</TableCell>
              <TableCell>{t.systems.supplier}</TableCell>
              <TableCell align='right'>{t.actions}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((sys) => (
              <TableRow key={sys.id} hover>
                <TableCell>
                  <Chip label={sys.systemId} size='small' variant='outlined' />
                </TableCell>
                <TableCell>{sys.name}</TableCell>
                <TableCell>
                  <Chip
                    label={sys.status}
                    size='small'
                    color={STATUS_COLORS[sys.status] ?? "default"}
                  />
                </TableCell>
                <TableCell>{sys.hostingType ?? "-"}</TableCell>
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
                <TableCell>{sys.Supplier?.name ?? "-"}</TableCell>
                <TableCell align='right'>
                  <IconButton size='small' onClick={() => setSelected(sys)}>
                    <Visibility />
                  </IconButton>
                  {canEdit && (
                    <IconButton
                      size='small'
                      onClick={() => {
                        setDialogSystem(sys);
                        setDialogMode("edit");
                      }}
                    >
                      <Edit />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} align='center' sx={{ py: 4 }}>
                  Inga system hittades
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      <ViewDialog
        open={!!selected}
        title={selected?.name ?? ""}
        onClose={() => setSelected(null)}
      >
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
          <Typography variant='body2'>
            <strong>System-ID:</strong> {selected?.systemId}
          </Typography>
          <Typography variant='body2'>
            <strong>Status:</strong> {selected?.status}
          </Typography>
          <Typography variant='body2'>
            <strong>Version:</strong> {selected?.version ?? "-"}
          </Typography>
          <Typography variant='body2'>
            <strong>Hosting:</strong> {selected?.hostingType ?? "-"}
          </Typography>
          <Typography variant='body2'>
            <strong>{t.systems.ownerOrg}:</strong>{" "}
            {selected?.ownerOrg?.name ?? "-"}
          </Typography>
          <Typography variant='body2'>
            <strong>{t.systems.systemOwner}:</strong>{" "}
            {selected?.systemOwner
              ? `${selected.systemOwner.firstName} ${selected.systemOwner.lastName}`
              : "-"}
          </Typography>
          <Typography variant='body2'>
            <strong>Teknisk kontakt:</strong>{" "}
            {selected?.technicalContact
              ? `${selected.technicalContact.firstName} ${selected.technicalContact.lastName}`
              : "-"}
          </Typography>
          <Typography variant='body2'>
            <strong>{t.systems.supplier}:</strong>{" "}
            {selected?.Supplier?.name ?? "-"}
          </Typography>
          <Typography variant='body2'>
            <strong>Kritikalitet:</strong>{" "}
            {selected?.CriticalityLevel?.name ?? "-"}
          </Typography>
        </Box>
        <Typography variant='body2' sx={{ mt: 2 }}>
          <strong>Beskrivning:</strong> {selected?.description ?? "-"}
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Typography variant='subtitle2' gutterBottom>
            Infosäkerhetsklass (K/R/T)
          </Typography>
          <Box sx={{ display: "flex", gap: 3 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Typography variant='caption'>Konfidentialitet</Typography>
              <KrtChip value={selected?.konfidentialitet ?? 0} />
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Typography variant='caption'>Riktighet</Typography>
              <KrtChip value={selected?.riktighet ?? 0} />
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Typography variant='caption'>Tillgänglighet</Typography>
              <KrtChip value={selected?.tillganglighet ?? 0} />
            </Box>
          </Box>
        </Box>
        {(() => {
          const systemRisks = selected ? risks.filter((r) => r.system === selected.systemId) : [];
          if (systemRisks.length === 0) return null;
          const RISK_COLORS: Record<string, "error" | "warning" | "info" | "success"> = {
            critical: "error", high: "warning", medium: "info", low: "success",
          };
          return (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>{t.risks.title} ({systemRisks.length})</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Risk</TableCell>
                    <TableCell>{t.risks.probability}</TableCell>
                    <TableCell>{t.risks.impact}</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>{t.risks.responsible}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {systemRisks.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.title}</TableCell>
                      <TableCell><Chip label={r.probability} size="small" color={RISK_COLORS[r.probability] ?? "default"} /></TableCell>
                      <TableCell><Chip label={r.impact} size="small" color={RISK_COLORS[r.impact] ?? "default"} /></TableCell>
                      <TableCell><Chip label={r.status} size="small" color={r.status === "open" ? "error" : "default"} /></TableCell>
                      <TableCell>{r.owner}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          );
        })()}
      </ViewDialog>

      <SystemFormDialog
        mode={dialogMode}
        system={dialogSystem}
        onClose={() => setDialogMode("closed")}
        onSaved={() => {
          setDialogMode("closed");
          loadSystems();
        }}
      />
    </AppShell>
  );
}
