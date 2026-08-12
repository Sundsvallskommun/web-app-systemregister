/**
 * orgTree beskriver användarens gren av organisationsträdet som en ¤-separerad
 * lista, en post per nivå med formatet `nivå|orgId|namn`:
 *
 *   2|org-it-avd|IT-avdelningen¤3|714|IT Drift¤4|720|IT Drift Nät
 *
 * Första posten är den högsta nivån (förvaltningen) — det är den vi scopar
 * behörigheten på. Värdet kommer i dag från IdP:n; när employee-API:t är
 * integrerat hämtas samma sträng därifrån i stället.
 */
const ENTRY_SEPARATOR = '¤';
const FIELD_SEPARATOR = '|';

/** orgId (andra fältet) ur orgTree:ns första post, eller undefined om det saknas. */
export function getOrgIdFromOrgTree(orgTree?: string | null): string | undefined {
  const [firstEntry] = (orgTree ?? '').trim().split(ENTRY_SEPARATOR);

  if (!firstEntry) return undefined;

  const parts = firstEntry.split(FIELD_SEPARATOR);

  return parts.length >= 3 ? parts[1].trim() || undefined : undefined;
}
