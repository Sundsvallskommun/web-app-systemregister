import type { SemanticColor } from "@/lib/enums";
import t from "@/lib/i18n";

/** Nivån då riktighet eller tillgänglighet gör systemet verksamhetskritiskt. */
export const BUSINESS_CRITICAL_THRESHOLD = 3;

/**
 * Ett system är verksamhetskritiskt när riktighet ELLER tillgänglighet 
 * når tröskelnivån. Konfidentialitet påverkar inte bedömningen.
 */
export function isBusinessCritical(
  riktighet: number,
  tillganglighet: number,
): boolean {
  return (
    riktighet >= BUSINESS_CRITICAL_THRESHOLD ||
    tillganglighet >= BUSINESS_CRITICAL_THRESHOLD
  );
}

/**
 * Sammanfattande skyddsnivå för hela klassningen, styrd av den högsta aspekten.
 * Skiljer sig från isBusinessCritical: här räknas även konfidentialitet med.
 */
export function classLevel(
  konfidentialitet: number,
  riktighet: number,
  tillganglighet: number,
): { label: string; color: SemanticColor } {
  const max = Math.max(konfidentialitet, riktighet, tillganglighet);
  if (max >= 4) return { label: t.krt.levels.veryHigh, color: "error" };
  if (max >= 3) return { label: t.krt.levels.high, color: "warning" };
  if (max >= 2) return { label: t.krt.levels.medium, color: "info" };
  return { label: t.krt.levels.low, color: "success" };
}
