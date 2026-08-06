"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { UserRole } from "./api";

export interface AuthState {
  token: string;
  role: UserRole;
  username?: string;
}

interface AuthContextValue {
  auth: AuthState | null;
  setAuth: (state: AuthState | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuthState] = useState<AuthState | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("auth");
    if (stored) {
      try { setAuthState(JSON.parse(stored)); } catch { /* ignore */ }
    }
    setLoaded(true);
  }, []);

  const setAuth = useCallback((state: AuthState | null) => {
    setAuthState(state);
    if (state) {
      sessionStorage.setItem("auth", JSON.stringify(state));
    } else {
      sessionStorage.removeItem("auth");
    }
  }, []);

  const logout = useCallback(() => setAuth(null), [setAuth]);

  if (!loaded) return null;

  return (
    <AuthContext.Provider value={{ auth, setAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
