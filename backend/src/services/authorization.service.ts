import { ADMIN_GROUP, EDITOR_GROUP, VIEWER_GROUP } from '@config';
import { UserRole } from '@/interfaces/user.interface';
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
