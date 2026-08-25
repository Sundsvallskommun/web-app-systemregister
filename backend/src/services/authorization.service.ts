import { ADMIN_GROUP, EDITOR_GROUP, VIEWER_GROUP } from '@config';
import { User, UserRole } from '@/interfaces/user.interface';
import { findPersonByUsername, RefData } from '@/services/enrich.service';
import { logger } from '@/utils/logger';
import { parseConfiguredGroups } from '@/utils/normalizeGroup';

/**
 * Behörighetsnivå styrs av AD-grupp, inte av användarkonton i den här appen.
 * Grupperna heter systemregister_admin / systemregister_editor / systemregister_viewer
 * och kan överstyras per miljö med ADMIN_GROUP / EDITOR_GROUP / VIEWER_GROUP
 * (kommaseparerad lista om flera grupper ska ge samma nivå).
 */
const DEFAULT_GROUPS: Record<UserRole, string> = {
  admin: 'systemregister_admin',
  editor: 'systemregister_editor',
  viewer: 'systemregister_viewer',
};

/** Fallande behörighetsordning — högst nivå först. */
const ROLE_PRECEDENCE: readonly UserRole[] = ['admin', 'editor', 'viewer'] as const;

function configuredGroups(role: UserRole, envValue?: string): string[] {
  const fromEnv = parseConfiguredGroups(envValue);
  return fromEnv.length > 0 ? fromEnv : [DEFAULT_GROUPS[role]];
}

const roleGroups: Record<UserRole, string[]> = {
  admin: configuredGroups('admin', ADMIN_GROUP),
  editor: configuredGroups('editor', EDITOR_GROUP),
  viewer: configuredGroups('viewer', VIEWER_GROUP),
};

/** Grupp -> roll, uppslagstabell byggd en gång vid uppstart. */
const groupRoleMapping: Record<string, UserRole> = {};
for (const role of ROLE_PRECEDENCE) {
  for (const group of roleGroups[role]) {
    // Om samma grupp konfigurerats på flera nivåer vinner den högsta.
    if (!groupRoleMapping[group]) {
      groupRoleMapping[group] = role;
    }
  }
}

/**
 * Högsta behörighetsnivån användarens grupper ger, eller null om ingen av dem
 * ger åtkomst till applikationen.
 *
 * @param groups Normaliserade (lowercase) AD-grupper från IdP:n
 */
export function getPrimaryRole(groups: string[]): UserRole | null {
  const roles = new Set<UserRole>();
  for (const group of groups) {
    const role = groupRoleMapping[group];
    if (role) roles.add(role);
  }
  return ROLE_PRECEDENCE.find(role => roles.has(role)) ?? null;
}

/**
 * Systemförvaltaren (editor) ser och redigerar bara de system den är utsedd
 * förvaltare för — systems.system_manager_id pekar ut personen. Admin ser hela
 * registret.
 */
export function isSystemManagerScoped(user: Pick<User, 'role'>): boolean {
  return user.role === 'editor';
}

/**
 * IT-samordnaren (viewer) ser bara system som ägs av den egna organisationen —
 * user.orgId kommer ur orgTree och matchar systems.owner_organization_id exakt.
 * Underliggande enheter räknas inte in; orgTree antas peka ut den nivå som äger
 * systemen.
 */
export function isOrganizationScoped(user: Pick<User, 'role'>): boolean {
  return user.role === 'viewer';
}

/** De fält på ett system som avgör om användaren når det. */
export interface ScopedSystem {
  systemManagerId?: unknown;
  ownerOrganizationId?: unknown;
}

export type Scope =
  | { kind: 'all' }
  | { kind: 'none' }
  | { kind: 'manager'; personId: string }
  | { kind: 'org'; orgId: string };

/**
 * Löser upp användarens begränsning en gång per request. Kopplingen mellan
 * AD-konto och person-post går via username, och mellan AD-konto och
 * organisation via orgTree. Saknas någon av dem blir urvalet tomt — hellre det
 * än att visa hela registret.
 *
 * Det här är enda stället som avgör vilka roller som begränsas. Både listningen
 * och kontrollen av enskilda system utgår härifrån, så de kan inte hamna i otakt
 * om reglerna ändras — och en ny roll kan inte råka hamna utanför urvalet.
 *
 * Referensdatan skickas in som en funktion eftersom bara de begränsade rollerna
 * behöver den; Admin svarar 'all' utan att hämta något. getRefs anropas högst en
 * gång per anrop, så anroparen kan skicka in loadRefData direkt.
 */
export async function resolveScope(user: User, getRefs: () => Promise<RefData>): Promise<Scope> {
  if (isSystemManagerScoped(user)) {
    const person = findPersonByUsername(await getRefs(), user.username);

    if (!person) {
      logger.warn(`${user.username} saknar person-post — ser inga system`);
      return { kind: 'none' };
    }

    return { kind: 'manager', personId: person.id };
  }

  if (isOrganizationScoped(user)) {
    if (!user.orgId) {
      logger.warn(`${user.username} saknar orgTree/orgId — ser inga system`);
      return { kind: 'none' };
    }

    const refs = await getRefs();

    if (!refs.organizations.has(user.orgId)) {
      logger.warn(`${user.username} har orgId ${user.orgId} som saknas i registret — ser inga system`);
      return { kind: 'none' };
    }

    return { kind: 'org', orgId: user.orgId };
  }

  if (user.role === 'admin') {
    return { kind: 'all' };
  }

  // Rollen känns inte igen — t.ex. en session skriven av en äldre version av
  // appen. Hellre inga system än hela registret; 'all' ska bara nås av Admin.
  logger.warn(`${user.username} har okänd roll ${user.role} — ser inga system`);
  return { kind: 'none' };
}

/**
 * Urvalet uttryckt som frågeparametrar, så att api-service filtrerar före
 * pagineringen och _meta räknar på användarens egna system i stället för på hela
 * registret. Klientens egna värden på parametrarna skrivs över — det är inget
 * den får välja. null betyder att användaren inte ser något.
 */
export function scopeToQuery(scope: Scope, query: Record<string, unknown>): Record<string, unknown> | null {
  switch (scope.kind) {
    case 'all':
      return query;
    case 'manager':
      return { ...query, systemManagerId: scope.personId };
    case 'org':
      return { ...query, ownerOrganizationId: scope.orgId };
    case 'none':
      return null;
  }
}

/** Samma urval, men för ett system som hämtats på id och inte via listningen. */
export function isInScope(scope: Scope, sys: ScopedSystem): boolean {
  switch (scope.kind) {
    case 'all':
      return true;
    case 'manager':
      return sys.systemManagerId === scope.personId;
    case 'org':
      return sys.ownerOrganizationId === scope.orgId;
    case 'none':
      return false;
  }
}

/** 403-text anpassad efter vad som begränsar användaren. */
export function scopeDeniedMessage(user: Pick<User, 'role'>): string {
  return isOrganizationScoped(user)
    ? 'Systemet ägs av en annan organisation'
    : 'Du är inte utsedd förvaltare för systemet';
}
