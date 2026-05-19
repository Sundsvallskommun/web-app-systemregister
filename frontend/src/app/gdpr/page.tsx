"use client";

import { useEffect, useState } from "react";
import {
  Typography, Box, Paper, Table, TableHead, TableRow, TableCell, TableBody,
  Chip, IconButton, Button, Alert,
} from "@mui/material";
import { Description, Visibility, Add } from "@mui/icons-material";
import AppShell from "@/components/AppShell";
import ViewDialog from "@/components/ViewDialog";
import { useAuth } from "@/lib/auth";
import { get } from "@/lib/api";
import type { PPB } from "@/lib/api";
import t from "@/lib/i18n";

const LEGAL_BASIS_LABELS = t.gdpr.legalBases;

export default function GdprPage() {
  const { auth } = useAuth();
  const [behandlingar, setBehandlingar] = useState<PPB[]>([]);
  const [selected, setSelected] = useState<PPB | null>(null);

  useEffect(() => {
    if (!auth) return;
    get<PPB[]>("/gdpr", auth.token).then(setBehandlingar).catch(() => {});
  }, [auth]);

  const canEdit = auth?.role === "admin" || auth?.role === "editor";

  return (
    <AppShell>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Description color="primary" />
          <Typography variant="h4">{t.gdpr.title}</Typography>
        </Box>
        {canEdit && <Button variant="contained" startIcon={<Add />}>{t.gdpr.newTreatment}</Button>}
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        {t.gdpr.infoText}
      </Alert>

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t.gdpr.treatmentId}</TableCell><TableCell>Namn</TableCell><TableCell>Status</TableCell>
              <TableCell>{t.gdpr.legalBasis}</TableCell><TableCell>{t.gdpr.sensitiveData}</TableCell><TableCell>{t.gdpr.ssn}</TableCell>
              <TableCell>{t.gdpr.controller}</TableCell><TableCell>System</TableCell><TableCell align="right">{t.actions}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {behandlingar.map((b) => (
              <TableRow key={b.id} hover>
                <TableCell><Chip label={b.behandlingId} size="small" variant="outlined" /></TableCell>
                <TableCell>{b.name}</TableCell>
                <TableCell><Chip label={b.status} size="small" color={b.status === "active" ? "success" : "default"} /></TableCell>
                <TableCell>{b.legalBasis ? LEGAL_BASIS_LABELS[b.legalBasis] ?? b.legalBasis : "-"}</TableCell>
                <TableCell><Chip label={b.processesSensitiveData ? "Ja" : "Nej"} size="small" color={b.processesSensitiveData ? "error" : "default"} /></TableCell>
                <TableCell><Chip label={b.processesSsn ? "Ja" : "Nej"} size="small" color={b.processesSsn ? "warning" : "default"} /></TableCell>
                <TableCell>{b.controller?.name ?? "-"}</TableCell>
                <TableCell>{(b.SystemModels ?? []).map((s) => <Chip key={s.id} label={s.systemId} size="small" sx={{ mr: 0.5 }} />)}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => setSelected(b)}><Visibility /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <ViewDialog open={!!selected} title={selected?.name ?? ""} onClose={() => setSelected(null)}>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
          <Typography variant="body2"><strong>{t.gdpr.treatmentId}:</strong> {selected?.behandlingId}</Typography>
          <Typography variant="body2"><strong>Status:</strong> {selected?.status}</Typography>
          <Typography variant="body2"><strong>{t.gdpr.legalBasis}:</strong> {selected?.legalBasis ? LEGAL_BASIS_LABELS[selected.legalBasis] ?? selected.legalBasis : "-"}</Typography>
          <Typography variant="body2"><strong>{t.gdpr.controller}:</strong> {selected?.controller?.name ?? "-"}</Typography>
          <Typography variant="body2"><strong>{t.gdpr.dpo}:</strong> {selected?.dpo ? `${selected.dpo.firstName} ${selected.dpo.lastName}` : "-"}</Typography>
          <Typography variant="body2"><strong>{t.gdpr.dpiaRequired}:</strong> {selected?.dpiaRequired ? "Ja" : "Nej"}</Typography>
          <Typography variant="body2"><strong>Känsliga uppgifter:</strong> {selected?.processesSensitiveData ? "Ja" : "Nej"}</Typography>
          <Typography variant="body2"><strong>{t.gdpr.thirdCountryTransfer}:</strong> {selected?.transfersToThirdCountry ? "Ja" : "Nej"}</Typography>
        </Box>
        <Typography variant="body2" sx={{ mt: 2 }}><strong>{t.gdpr.purpose}:</strong> {selected?.purposeDescription ?? "-"}</Typography>
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2">{t.gdpr.linkedSystems}</Typography>
          {(selected?.SystemModels ?? []).map((s) => <Chip key={s.id} label={`${s.systemId} - ${s.name}`} sx={{ mr: 1, mt: 0.5 }} />)}
        </Box>
      </ViewDialog>
    </AppShell>
  );
}
