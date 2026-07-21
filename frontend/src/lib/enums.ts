import t from "@/lib/i18n";

export type SemanticColor =
  | "tertiary"
  | "info"
  | "success"
  | "warning"
  | "error"
  | "vattjom"
  | "gronsta"
  | "bjornstigen"
  | "juniskar";

export interface EnumMeta {
  label: string;
  color: SemanticColor;
}

export type EnumMap = Record<string, EnumMeta>;

export function metaFor(map: EnumMap, value: string): EnumMeta {
  return map[value?.toLowerCase()] ?? { label: value, color: "tertiary" };
}

export const SYSTEM_STATUS: EnumMap = {
  planned: { label: t.systems.statuses.planned, color: "warning" },
  development: { label: t.systems.statuses.development, color: "info" },
  production: { label: t.systems.statuses.production, color: "success" },
  deprecated: { label: t.systems.statuses.deprecated, color: "error" },
  retired: { label: t.systems.statuses.retired, color: "tertiary" },
};

export const HOSTING_TYPE: EnumMap = {
  cloud: { label: t.systems.hostingTypes.cloud, color: "info" },
  internal: { label: t.systems.hostingTypes.internal, color: "tertiary" },
};

/** Shared by risk probability and impact (both use the same low→critical scale). */
export const RISK_LEVEL: EnumMap = {
  low: { label: t.risks.levels.low, color: "success" },
  medium: { label: t.risks.levels.medium, color: "info" },
  high: { label: t.risks.levels.high, color: "warning" },
  critical: { label: t.risks.levels.critical, color: "error" },
};

export const RISK_STATUS: EnumMap = {
  open: { label: t.risks.statuses.open, color: "error" },
  mitigated: { label: t.risks.statuses.mitigated, color: "success" },
  accepted: { label: t.risks.statuses.accepted, color: "warning" },
  closed: { label: t.risks.statuses.closed, color: "tertiary" },
};

export const GDPR_STATUS: EnumMap = {
  active: { label: t.active, color: "success" },
};

/** K/R/T classification levels (0 = unset, 4 = highest). Numeric, so no label map. */
export const KRT_LEVEL_COLOR: Record<number, SemanticColor> = {
  0: "tertiary",
  1: "success",
  2: "warning",
  3: "error",
  4: "error",
};
