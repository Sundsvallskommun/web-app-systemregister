/**
 *   admin  — Admin. Får som enda roll registrera nya system.
 *   editor — Systemförvaltare. Redigerar de system den förvaltar.
 *   viewer — IT-samordnare. Läsbehörighet inom sin förvaltning.
 */
export type UserRole = 'admin' | 'editor' | 'viewer';

export interface User {
  id: string;
  username: string;
  email?: string;
  name?: string;
  role: UserRole;
}

export interface JwtPayload {
  sub: string;
  username: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}
