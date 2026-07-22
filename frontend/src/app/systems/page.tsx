"use client";

import { useEffect, useState, useCallback } from "react";
import { Button, Label, SearchField, Table } from "@sk-web-gui/react";
import { Plus, Eye, Pencil } from "lucide-react";
import AppShell from "@/components/AppShell";
import EnumLabel from "@/components/EnumLabel";
import { KrtChip } from "@/components/KrtDisplay";
import ViewDialog from "@/components/ViewDialog";
import SystemFormDialog from "@/components/SystemFormDialog";
import { useAuth } from "@/lib/auth";
import { useRisks } from "@/lib/riskStore";
import {
  SYSTEM_STATUS,
  HOSTING_TYPE,
  RISK_LEVEL,
  RISK_STATUS,
  metaFor,
} from "@/lib/enums";
import { get } from "@/lib/api";
import type { System, PaginatedResponse } from "@/lib/api";
import t from "@/lib/i18n";

export default function SystemsPage() {
  const { auth } = useAuth();
  const { risks } = useRisks();
  const [systems, setSystems] = useState<System[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<System | null>(null);
  const [dialogMode, setDialogMode] = useState<"closed" | "create" | "edit">(
    "closed",
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
      s.systemId.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <AppShell>
      <div className="flex xs:flex-col sm:flex-row xs:items-start sm:items-center justify-between mb-24">
        <h1 className="text-h2">{t.systems.title}</h1>
        {canEdit && (
          <Button
            variant="primary"
            leftIcon={<Plus />}
            onClick={() => {
              setDialogSystem(null);
              setDialogMode("create");
            }}
          >
            {t.systems.newSystem}
          </Button>
        )}
      </div>

      <SearchField
        className="mb-16 max-w-[30rem]"
        placeholder={t.systems.searchPlaceholder}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onReset={() => setSearch("")}
        showSearchButton={false}
      />

      <Table background scrollable="x">
        <Table.Header>
          <Table.HeaderColumn>{t.systems.systemId}</Table.HeaderColumn>
          <Table.HeaderColumn>{t.name}</Table.HeaderColumn>
          <Table.HeaderColumn>{t.status}</Table.HeaderColumn>
          <Table.HeaderColumn>{t.systems.hosting}</Table.HeaderColumn>
          <Table.HeaderColumn>{t.owner}</Table.HeaderColumn>
          <Table.HeaderColumn className="justify-center">
            {t.krt.short.k}
          </Table.HeaderColumn>
          <Table.HeaderColumn className="justify-center">
            {t.krt.short.r}
          </Table.HeaderColumn>
          <Table.HeaderColumn className="justify-center">
            {t.krt.short.t}
          </Table.HeaderColumn>
          <Table.HeaderColumn>{t.systems.supplier}</Table.HeaderColumn>
          <Table.HeaderColumn className="justify-end">
            {t.actions}
          </Table.HeaderColumn>
        </Table.Header>
        <Table.Body>
          {filtered.map((sys) => (
            <Table.Row key={sys.id}>
              <Table.Column>
                <Label color="tertiary" className="whitespace-nowrap">{sys.systemId}</Label>
              </Table.Column>
              <Table.Column>{sys.name}</Table.Column>
              <Table.Column>
                <EnumLabel value={sys.status} map={SYSTEM_STATUS} />
              </Table.Column>
              <Table.Column>
                {sys.hostingType
                  ? metaFor(HOSTING_TYPE, sys.hostingType).label
                  : t.emptyValue}
              </Table.Column>
              <Table.Column>{sys.ownerOrg?.name ?? t.emptyValue}</Table.Column>
              <Table.Column className="justify-center">
                <KrtChip value={sys.konfidentialitet} />
              </Table.Column>
              <Table.Column className="justify-center">
                <KrtChip value={sys.riktighet} />
              </Table.Column>
              <Table.Column className="justify-center">
                <KrtChip value={sys.tillganglighet} />
              </Table.Column>
              <Table.Column>{sys.Supplier?.name ?? t.emptyValue}</Table.Column>
              <Table.Column className="justify-end">
                <div className="inline-flex gap-4">
                  <Button
                    iconButton
                    size="sm"
                    variant="tertiary"
                    aria-label={t.a11y.view(sys.name)}
                    onClick={() => setSelected(sys)}
                  >
                    <Eye />
                  </Button>
                  {canEdit && (
                    <Button
                      iconButton
                      size="sm"
                      variant="tertiary"
                      aria-label={t.a11y.edit(sys.name)}
                      onClick={() => {
                        setDialogSystem(sys);
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
              <Table.Column colSpan={10} className="justify-center py-32">
                {t.systems.noSystems}
              </Table.Column>
            </Table.Row>
          )}
        </Table.Body>
      </Table>

      <ViewDialog
        open={!!selected}
        title={selected?.name ?? ""}
        onClose={() => setSelected(null)}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-16">
          <p className="text-small">
            <strong>{t.systems.systemId}:</strong> {selected?.systemId}
          </p>
          <p className="text-small">
            <strong>{t.status}:</strong>{" "}
            {selected
              ? metaFor(SYSTEM_STATUS, selected.status).label
              : t.emptyValue}
          </p>
          <p className="text-small">
            <strong>{t.version}:</strong> {selected?.version ?? t.emptyValue}
          </p>
          <p className="text-small">
            <strong>{t.systems.hosting}:</strong>{" "}
            {selected?.hostingType
              ? metaFor(HOSTING_TYPE, selected.hostingType).label
              : t.emptyValue}
          </p>
          <p className="text-small">
            <strong>{t.systems.ownerOrg}:</strong>{" "}
            {selected?.ownerOrg?.name ?? t.emptyValue}
          </p>
          <p className="text-small">
            <strong>{t.systems.systemOwner}:</strong>{" "}
            {selected?.systemOwner
              ? `${selected.systemOwner.firstName} ${selected.systemOwner.lastName}`
              : t.emptyValue}
          </p>
          <p className="text-small">
            <strong>{t.systems.technicalContact}:</strong>{" "}
            {selected?.technicalContact
              ? `${selected.technicalContact.firstName} ${selected.technicalContact.lastName}`
              : t.emptyValue}
          </p>
          <p className="text-small">
            <strong>{t.systems.supplier}:</strong>{" "}
            {selected?.Supplier?.name ?? t.emptyValue}
          </p>
          <p className="text-small">
            <strong>{t.systems.criticality}:</strong>{" "}
            {selected?.CriticalityLevel?.name ?? t.emptyValue}
          </p>
        </div>
        <p className="text-small mt-16">
          <strong>{t.description}:</strong>{" "}
          {selected?.description ?? t.emptyValue}
        </p>
        <div className="mt-16">
          <p className="text-small font-bold mb-8">{t.krt.title}</p>
          <div className="flex flex-wrap gap-8">
            <div className="flex flex-col gap-4 w-[10rem]">
              <span className="text-small">{t.krt.confidentiality}</span>
              <KrtChip value={selected?.konfidentialitet ?? 0} />
            </div>
            <div className="flex flex-col gap-4 w-[10rem]">
              <span className="text-small">{t.krt.integrity}</span>
              <KrtChip value={selected?.riktighet ?? 0} />
            </div>
            <div className="flex flex-col gap-4 w-[10rem]">
              <span className="text-small">{t.krt.availability}</span>
              <KrtChip value={selected?.tillganglighet ?? 0} />
            </div>
          </div>
        </div>
        {(() => {
          const systemRisks = selected
            ? risks.filter((r) => r.system === selected.systemId)
            : [];
          if (systemRisks.length === 0) return null;
          return (
            <div className="mt-24">
              <p className="text-small font-bold mb-8">
                {t.risks.title} ({systemRisks.length})
              </p>
              <Table background dense scrollable="x">
                <Table.Header>
                  <Table.HeaderColumn>{t.risks.risk}</Table.HeaderColumn>
                  <Table.HeaderColumn>{t.risks.probability}</Table.HeaderColumn>
                  <Table.HeaderColumn>{t.risks.impact}</Table.HeaderColumn>
                  <Table.HeaderColumn>{t.status}</Table.HeaderColumn>
                  <Table.HeaderColumn>{t.risks.responsible}</Table.HeaderColumn>
                </Table.Header>
                <Table.Body>
                  {systemRisks.map((r) => (
                    <Table.Row key={r.id}>
                      <Table.Column>{r.title}</Table.Column>
                      <Table.Column>
                        <EnumLabel value={r.probability} map={RISK_LEVEL} />
                      </Table.Column>
                      <Table.Column>
                        <EnumLabel value={r.impact} map={RISK_LEVEL} />
                      </Table.Column>
                      <Table.Column>
                        <EnumLabel value={r.status} map={RISK_STATUS} />
                      </Table.Column>
                      <Table.Column>{r.owner}</Table.Column>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
            </div>
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
