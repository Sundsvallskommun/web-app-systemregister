import type { AuthState } from "./auth";

/** Admin och Systemförvaltare får redigera befintliga poster. */
export function hasEditRights(auth: AuthState | null): boolean {
  return auth?.role === "admin" || auth?.role === "editor";
}

/** Endast Admin registrerar nya system. */
export function canCreateSystem(auth: AuthState | null): boolean {
  return auth?.role === "admin";
}
