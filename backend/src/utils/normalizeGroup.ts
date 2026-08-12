/**
 * IdP:er skickar gruppnamn med varierande citattecken och versaler. Normalisera
 * till lowercase utan omgivande citat så jämförelser blir förutsägbara.
 */
export const normalizeGroup = (group?: string | null): string => {
  if (!group) return '';

  return group
    .trim()
    .replace(/^['"‘’“”]+|['"‘’“”]+$/g, '')
    .toLowerCase();
};

/** Parsar en kommaseparerad env-variabel med gruppnamn. */
export const parseConfiguredGroups = (groups?: string | null): string[] => {
  if (!groups) return [];

  return groups.split(',').map(normalizeGroup).filter(Boolean);
};
