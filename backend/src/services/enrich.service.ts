import { apiService } from './api.service';

interface SupplierRef {
  id: string;
  name: string;
  description?: string;
  orgNumber?: string;
  website?: string;
  contactEmail?: string;
  isActive?: boolean;
}

interface PersonRef {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

interface OrgRef {
  id: string;
  name: string;
}

interface CriticalityRef {
  id: string;
  name: string;
  level: number;
  color?: string;
}

export interface RefData {
  suppliers: Map<string, SupplierRef>;
  persons: Map<string, PersonRef>;
  organizations: Map<string, OrgRef>;
  criticalityLevels: Map<string, CriticalityRef>;
}

/** Hantera både flat [] och paginated { _meta, <resource>: [] } */
function asArray<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    const key = Object.keys(obj).find(k => k !== '_meta' && Array.isArray(obj[k]));
    if (key) return obj[key] as T[];
  }
  return [];
}

function toMap<T extends { id: string }>(arr: T[]): Map<string, T> {
  return new Map(arr.map(item => [item.id, item]));
}

/**
 * Hämtar referensdata parallellt från api-service. Används för att berika
 * resurser med embedded objekt i stället för bara ID:n.
 */
export async function loadRefData(): Promise<RefData> {
  const [suppliersRaw, personsRaw, orgsRaw, critRaw] = await Promise.all([
    apiService.get<unknown>('suppliers'),
    apiService.get<unknown>('persons'),
    apiService.get<unknown>('organizations'),
    apiService.get<unknown>('criticality-levels'),
  ]);

  return {
    suppliers: toMap(asArray<SupplierRef>(suppliersRaw)),
    persons: toMap(asArray<PersonRef>(personsRaw)),
    organizations: toMap(asArray<OrgRef>(orgsRaw)),
    criticalityLevels: toMap(asArray<CriticalityRef>(critRaw)),
  };
}

interface SystemBase {
  id: string;
  ownerOrganizationId?: string;
  systemOwnerId?: string;
  technicalContactId?: string;
  supplierId?: string;
  criticalityLevelId?: string;
  [k: string]: unknown;
}

/**
 * Lägg till embedded objekt (ownerOrg, systemOwner, technicalContact, Supplier,
 * CriticalityLevel) på ett system så frontend's ${system.Supplier?.name}-stil
 * fungerar. Behåller alla ursprungliga fält oförändrade.
 */
export function enrichSystem(sys: SystemBase, refs: RefData): Record<string, unknown> {
  const owner = sys.ownerOrganizationId ? refs.organizations.get(sys.ownerOrganizationId) : undefined;
  const sysOwner = sys.systemOwnerId ? refs.persons.get(sys.systemOwnerId) : undefined;
  const techContact = sys.technicalContactId ? refs.persons.get(sys.technicalContactId) : undefined;
  const supplier = sys.supplierId ? refs.suppliers.get(sys.supplierId) : undefined;
  const crit = sys.criticalityLevelId ? refs.criticalityLevels.get(sys.criticalityLevelId) : undefined;

  return {
    ...sys,
    ownerOrg: owner ? { id: owner.id, name: owner.name } : undefined,
    systemOwner: sysOwner
      ? { id: sysOwner.id, firstName: sysOwner.firstName, lastName: sysOwner.lastName, email: sysOwner.email }
      : undefined,
    technicalContact: techContact
      ? { id: techContact.id, firstName: techContact.firstName, lastName: techContact.lastName, email: techContact.email }
      : undefined,
    Supplier: supplier,
    CriticalityLevel: crit
      ? { id: crit.id, name: crit.name, level: crit.level, color: crit.color }
      : undefined,
  };
}
