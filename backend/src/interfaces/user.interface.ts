/**
 *   admin  — Admin. Får som enda roll registrera nya system.
 *   editor — Systemförvaltare. Redigerar de system den förvaltar.
 *   viewer — IT-samordnare. Läsbehörighet inom sin förvaltning.
 */
export type UserRole = 'admin' | 'editor' | 'viewer';

export interface User {
  /** AD-konto, t.ex. "nam01sur" */
  username: string;
  name: string;
  givenName: string;
  surname: string;
  email: string;
  /** Normaliserade (lowercase) AD-grupper från IdP:n */
  groups: string[];
  /** Högsta behörighetsnivå användarens grupper ger */
  role: UserRole;
  /**
   * Användarens organisation ur orgTree — matchar organizations.id i registret.
   * Saknas om IdP:n inte skickar med något orgTree.
   */
  orgId?: string;
}

type AppUser = User;

/**
 * Passport lägger den inloggade användaren på req.user, typad som Express.User.
 * Utöka den med vår User så req.user.role m.fl. blir typade i hela appen.
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface User extends AppUser {}
  }
}
