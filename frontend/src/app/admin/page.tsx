"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Typography, Box, Paper, Table, TableHead, TableRow, TableCell, TableBody,
  Chip, Alert, IconButton,
} from "@mui/material";
import { AdminPanelSettings, Edit } from "@mui/icons-material";
import AppShell from "@/components/AppShell";
import AdminRoleDialog from "@/components/AdminRoleDialog";
import { useAuth } from "@/lib/auth";
import { get } from "@/lib/api";
import type { AdminUser } from "@/lib/api";
import t from "@/lib/i18n";

const ROLE_COLORS: Record<string, "error" | "warning" | "default"> = {
  admin: "error", editor: "warning", viewer: "default",
};

export default function AdminPage() {
  const { auth } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);

  const load = useCallback(() => {
    if (!auth || auth.role !== "admin") return;
    get<AdminUser[]>("/admin", auth.token).then(setUsers).catch(() => {});
  }, [auth]);

  useEffect(() => { load(); }, [load]);

  if (auth?.role !== "admin") {
    return <AppShell><Alert severity="error">{t.admin.noAccess}</Alert></AppShell>;
  }

  return (
    <AppShell>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
        <AdminPanelSettings color="primary" />
        <Typography variant="h4">{t.admin.title}</Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>{t.admin.infoText}</Alert>

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t.username}</TableCell><TableCell>Namn</TableCell><TableCell>E-post</TableCell>
              <TableCell>{t.admin.role}</TableCell><TableCell>Status</TableCell><TableCell>{t.admin.created}</TableCell>
              <TableCell align="right">{t.actions}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id} hover>
                <TableCell>{u.username}</TableCell>
                <TableCell>{u.name ?? "-"}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell><Chip label={u.role} size="small" color={ROLE_COLORS[u.role] ?? "default"} /></TableCell>
                <TableCell><Chip label={u.isActive ? "Aktiv" : "Inaktiv"} size="small" color={u.isActive ? "success" : "default"} /></TableCell>
                <TableCell>{new Date(u.createdAt).toLocaleDateString("sv-SE")}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => setEditUser(u)}><Edit /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <AdminRoleDialog user={editUser} onClose={() => setEditUser(null)} onSaved={() => { setEditUser(null); load(); }} />
    </AppShell>
  );
}
