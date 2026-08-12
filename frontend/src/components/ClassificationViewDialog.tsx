"use client";

import { Card, Label, Link } from "@sk-web-gui/react";
import { KrtChip } from "@/components/KrtDisplay";
import ViewDialog from "@/components/ViewDialog";
import type { System } from "@/lib/api";
import { isBusinessCritical } from "@/lib/krt";
import t from "@/lib/i18n";

const ASPECTS = [
  {
    level: "konfidentialitet",
    motivering: "konfidentialitetMotivering",
    label: t.krt.confidentiality,
  },
  {
    level: "riktighet",
    motivering: "riktighetMotivering",
    label: t.krt.integrity,
  },
  {
    level: "tillganglighet",
    motivering: "tillganglighetMotivering",
    label: t.krt.availability,
  },
] as const;

interface Props {
  system: System | null;
  onClose: () => void;
}

export default function ClassificationViewDialog({ system, onClose }: Props) {
  const businessCritical = system
    ? isBusinessCritical(system.riktighet, system.tillganglighet)
    : false;

  return (
    <ViewDialog
      open={!!system}
      title={t.krt.viewTitle(system?.systemId ?? "", system?.name ?? "")}
      onClose={onClose}
    >
      <div className="flex flex-col gap-16">
        {ASPECTS.map(({ level, motivering, label }) => (
          <Card key={level} color="tertiary">
            <Card.Body className="flex flex-col gap-8">
              <div className="flex items-center gap-12">
                <span className="text-large font-bold">{label}</span>
                <KrtChip value={system?.[level] ?? 0} />
              </div>
              <p className="text-small">
                {system?.[motivering] || t.emptyValue}
              </p>
            </Card.Body>
          </Card>
        ))}

        <Card color="tertiary">
          <Card.Body>
            <div className="flex items-center gap-12">
              <span className="text-large font-bold">
                {t.krt.businessCritical}
              </span>
              <Label color={businessCritical ? "error" : "tertiary"}>
                {businessCritical ? t.yes : t.no}
              </Label>
            </div>
          </Card.Body>
        </Card>

        {businessCritical && (
          <Card color="tertiary">
            <Card.Body className="flex flex-col gap-8">
              <div className="flex items-center gap-12">
                <span className="text-large font-bold">
                  {t.krt.societalCritical}
                </span>
                <Label color={system?.samhallsviktigt ? "error" : "tertiary"}>
                  {system?.samhallsviktigt ? t.yes : t.no}
                </Label>
              </div>
              <p className="text-small">
                {system?.samhallsviktigtMotivering || t.emptyValue}
              </p>
              <Link href={t.krt.mcfUrl} external size="sm">
                {t.krt.mcfLinkLabel}
              </Link>
            </Card.Body>
          </Card>
        )}
      </div>
    </ViewDialog>
  );
}
