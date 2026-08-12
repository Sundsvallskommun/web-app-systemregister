"use client";

import { useEffect, useState, useCallback } from "react";
import { Button, Label, SearchField, Table } from "@sk-web-gui/react";
import { Plus, Eye, Pencil } from "lucide-react";
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
  const [dialogMode, setDialogMode] = useState<"closed" | "create" | "edit">(
    "closed",
  );
  const [dialogSupplier, setDialogSupplier] = useState<Supplier | null>(null);

  const load = useCallback(() => {
    if (!auth) return;
    get<Supplier[]>("/suppliers")
      .then(setSuppliers)
      .catch(() => {});
  }, [auth]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = suppliers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  );
  const canEdit = auth?.role === "admin" || auth?.role === "editor";

  return (
    <AppShell>
      <div className="flex xs:flex-col sm:flex-row xs:items-start sm:items-center justify-between mb-24">
        <h1 className="text-h2">{t.suppliers.title}</h1>
        {canEdit && (
          <Button
            variant="primary"
            leftIcon={<Plus />}
            onClick={() => {
              setDialogSupplier(null);
              setDialogMode("create");
            }}
          >
            {t.suppliers.newSupplier}
          </Button>
        )}
      </div>

      <SearchField
        className="mb-16 max-w-[30rem]"
        placeholder={t.suppliers.searchPlaceholder}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onReset={() => setSearch("")}
        showSearchButton={false}
      />

      <Table background scrollable="x">
        <Table.Header>
          <Table.HeaderColumn>{t.name}</Table.HeaderColumn>
          <Table.HeaderColumn>{t.suppliers.orgNumber}</Table.HeaderColumn>
          <Table.HeaderColumn>{t.suppliers.contactEmail}</Table.HeaderColumn>
          <Table.HeaderColumn>{t.suppliers.website}</Table.HeaderColumn>
          <Table.HeaderColumn>{t.status}</Table.HeaderColumn>
          <Table.HeaderColumn className="justify-end" sticky={true}>
            {t.actions}
          </Table.HeaderColumn>
        </Table.Header>
        <Table.Body>
          {filtered.map((sup) => (
            <Table.Row key={sup.id}>
              <Table.Column>{sup.name}</Table.Column>
              <Table.Column>{sup.orgNumber ?? t.emptyValue}</Table.Column>
              <Table.Column>{sup.contactEmail ?? t.emptyValue}</Table.Column>
              <Table.Column>{sup.website ?? t.emptyValue}</Table.Column>
              <Table.Column>
                <Label color={sup.isActive ? "success" : "tertiary"}>
                  {sup.isActive ? t.active : t.inactive}
                </Label>
              </Table.Column>
              <Table.Column className="justify-end" sticky={true}>
                <div className="inline-flex gap-4">
                  <Button
                    iconButton
                    size="sm"
                    variant="tertiary"
                    aria-label={t.a11y.view(sup.name)}
                    onClick={() => setSelected(sup)}
                  >
                    <Eye />
                  </Button>
                  {canEdit && (
                    <Button
                      iconButton
                      size="sm"
                      variant="tertiary"
                      aria-label={t.a11y.edit(sup.name)}
                      onClick={() => {
                        setDialogSupplier(sup);
                        setDialogMode("edit");
                      }}
                    >
                      <Pencil />
                    </Button>
                  )}
                </div>
              </Table.Column>
            </Table.Row>
          ))}
          {filtered.length === 0 && (
            <Table.Row>
              <Table.Column colSpan={6} className="justify-center py-32">
                {t.suppliers.noSuppliers}
              </Table.Column>
            </Table.Row>
          )}
        </Table.Body>
      </Table>

      <ViewDialog
        open={!!selected}
        title={selected?.name ?? ""}
        onClose={() => setSelected(null)}
        maxWidth="sm"
      >
        <div className="flex flex-col gap-8">
          <p className="text-small">
            <strong>{t.suppliers.orgNumber}:</strong>{" "}
            {selected?.orgNumber ?? t.emptyValue}
          </p>
          <p className="text-small">
            <strong>{t.suppliers.website}:</strong>{" "}
            {selected?.website ?? t.emptyValue}
          </p>
          <p className="text-small">
            <strong>{t.suppliers.contactEmail}:</strong>{" "}
            {selected?.contactEmail ?? t.emptyValue}
          </p>
          <p className="text-small">
            <strong>{t.description}:</strong>{" "}
            {selected?.description ?? t.emptyValue}
          </p>
          <p className="text-small">
            <strong>{t.status}:</strong>{" "}
            {selected?.isActive ? t.active : t.inactive}
          </p>
        </div>
      </ViewDialog>

      <SupplierFormDialog
        mode={dialogMode}
        supplier={dialogSupplier}
        onClose={() => setDialogMode("closed")}
        onSaved={() => {
          setDialogMode("closed");
          load();
        }}
      />
    </AppShell>
  );
}
