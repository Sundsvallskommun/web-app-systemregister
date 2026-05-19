"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Typography, Box, Paper, Table, TableHead, TableRow, TableCell, TableBody,
  Chip, Button, TextField, InputAdornment, IconButton,
} from "@mui/material";
import { Search, Add, Edit, Visibility } from "@mui/icons-material";
import AppShell from "@/components/AppShell";
import ViewDialog from "@/components/ViewDialog";
import SupplierFormDialog from "@/components/SupplierFormDialog";
import { useAuth } from "@/lib/auth";
import { get } from "@/lib/api";
import type { Supplier } from "@/lib/api";
import t from "@/lib/i18n";

export default function SuppliersPage() {
  const { auth } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Supplier | null>(null);
  const [dialogMode, setDialogMode] = useState<"closed" | "create" | "edit">("closed");
  const [dialogSupplier, setDialogSupplier] = useState<Supplier | null>(null);

  const load = useCallback(() => {
    if (!auth) return;
    get<Supplier[]>("/suppliers", auth.token).then(setSuppliers).catch(() => {});
  }, [auth]);

  useEffect(() => { load(); }, [load]);

  const filtered = suppliers.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));
  const canEdit = auth?.role === "admin" || auth?.role === "editor";

  return (
    <AppShell>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4">{t.suppliers.title}</Typography>
        {canEdit && <Button variant="contained" startIcon={<Add />} onClick={() => { setDialogSupplier(null); setDialogMode("create"); }}>Ny leverantör</Button>}
      </Box>

      <TextField placeholder={t.suppliers.searchPlaceholder} size="small" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ mb: 2, width: 300 }}
        slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search /></InputAdornment> } }} />

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Namn</TableCell><TableCell>Org.nr</TableCell><TableCell>E-post</TableCell>
              <TableCell>Webbplats</TableCell><TableCell>Status</TableCell><TableCell align="right">{t.actions}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((sup) => (
              <TableRow key={sup.id} hover>
                <TableCell>{sup.name}</TableCell>
                <TableCell>{sup.orgNumber ?? "-"}</TableCell>
                <TableCell>{sup.contactEmail ?? "-"}</TableCell>
                <TableCell>{sup.website ?? "-"}</TableCell>
                <TableCell><Chip label={sup.isActive ? "Aktiv" : "Inaktiv"} size="small" color={sup.isActive ? "success" : "default"} /></TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => setSelected(sup)}><Visibility /></IconButton>
                  {canEdit && <IconButton size="small" onClick={() => { setDialogSupplier(sup); setDialogMode("edit"); }}><Edit /></IconButton>}
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}>{t.suppliers.noSuppliers}</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Paper>

      <ViewDialog open={!!selected} title={selected?.name ?? ""} onClose={() => setSelected(null)} maxWidth="sm">
        <Typography variant="body2" gutterBottom><strong>Org.nr:</strong> {selected?.orgNumber ?? "-"}</Typography>
        <Typography variant="body2" gutterBottom><strong>Webbplats:</strong> {selected?.website ?? "-"}</Typography>
        <Typography variant="body2" gutterBottom><strong>Kontakt:</strong> {selected?.contactEmail ?? "-"}</Typography>
        <Typography variant="body2" gutterBottom><strong>Beskrivning:</strong> {selected?.description ?? "-"}</Typography>
        <Typography variant="body2" gutterBottom><strong>Status:</strong> {selected?.isActive ? "Aktiv" : "Inaktiv"}</Typography>
      </ViewDialog>

      <SupplierFormDialog mode={dialogMode} supplier={dialogSupplier} onClose={() => setDialogMode("closed")} onSaved={() => { setDialogMode("closed"); load(); }} />
    </AppShell>
  );
}
