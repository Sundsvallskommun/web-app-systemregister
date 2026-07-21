"use client";

import { useEffect, useState, useCallback } from "react";
import { Alert, Button, Label, Table } from "@sk-web-gui/react";
import { Pencil } from "lucide-react";
import AppShell from "@/components/AppShell";
import AdminRoleDialog from "@/components/AdminRoleDialog";
import EnumLabel from "@/components/EnumLabel";
import { useAuth } from "@/lib/auth";
import { get } from "@/lib/api";
import type { AdminUser } from "@/lib/api";
import { USER_ROLE } from "@/lib/enums";
import t from "@/lib/i18n";

export default function AdminPage() {
  const { auth } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);

  const load = useCallback(() => {
    if (!auth || auth.role !== "admin") return;
    get<AdminUser[]>("/admin", auth.token).then(setUsers).catch(() => {});
  }, [auth]);

  useEffect(() => {
    load();
  }, [load]);

  if (auth?.role !== "admin") {
    return (
      <AppShell>
        <Alert type="error">{t.admin.noAccess}</Alert>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <h1 className="text-h2 mb-24">{t.admin.title}</h1>

      <p className="mb-24">{t.admin.infoText}</p>

      <Table background scrollable="x">
        <Table.Header>
          <Table.HeaderColumn>{t.username}</Table.HeaderColumn>
          <Table.HeaderColumn>{t.name}</Table.HeaderColumn>
          <Table.HeaderColumn>{t.email}</Table.HeaderColumn>
          <Table.HeaderColumn>{t.admin.role}</Table.HeaderColumn>
          <Table.HeaderColumn>{t.status}</Table.HeaderColumn>
          <Table.HeaderColumn>{t.admin.created}</Table.HeaderColumn>
          <Table.HeaderColumn className="justify-end">
            {t.actions}
          </Table.HeaderColumn>
        </Table.Header>
        <Table.Body>
          {users.map((u) => (
            <Table.Row key={u.id}>
              <Table.Column>{u.username}</Table.Column>
              <Table.Column>{u.name ?? t.emptyValue}</Table.Column>
              <Table.Column>{u.email}</Table.Column>
              <Table.Column>
                <EnumLabel value={u.role} map={USER_ROLE} />
              </Table.Column>
              <Table.Column>
                <Label color={u.isActive ? "success" : "tertiary"}>
                  {u.isActive ? t.active : t.inactive}
                </Label>
              </Table.Column>
              <Table.Column>
                {new Date(u.createdAt).toLocaleDateString("sv-SE")}
              </Table.Column>
              <Table.Column className="justify-end">
                <Button
                  iconButton
                  size="sm"
                  variant="tertiary"
                  aria-label={t.a11y.edit(u.username)}
                  onClick={() => setEditUser(u)}
                >
                  <Pencil />
                </Button>
              </Table.Column>
            </Table.Row>
          ))}
          {users.length === 0 && (
            <Table.Row>
              <Table.Column colSpan={7} className="justify-center py-32">
                {t.noResults}
              </Table.Column>
            </Table.Row>
          )}
        </Table.Body>
      </Table>

      <AdminRoleDialog
        user={editUser}
        onClose={() => setEditUser(null)}
        onSaved={() => {
          setEditUser(null);
          load();
        }}
      />
    </AppShell>
  );
}
