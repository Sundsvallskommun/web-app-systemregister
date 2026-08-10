"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { getMe, ssoLoginUrl, ssoLogoutUrl, type Role } from "./api";

export interface AuthState {
  username: string;
  name: string;
  givenName: string;
  surname: string;
  email: string;
  /** AD-grupper användaren är medlem i (normaliserade till lowercase) */
  groups: string[];
  role: Role;
}

interface AuthContextValue {
  auth: AuthState | null;
  /** true tills /me har svarat — undviker att guards redirectar för tidigt */
  loading: boolean;
  /** Startar SSO-inloggningen (full sidnavigering till BFF -> IdP) */
  login: (returnPath?: string) => void;
  /** Loggar ut lokalt och hos IdP:n (Single Logout) */
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await getMe();
      setAuth(res.data);
    } catch {
      setAuth(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Sessionen lever i en cookie hos BFF:en — /me är enda sättet att veta om
  // den fortfarande gäller.
  useEffect(() => {
    let active = true;

    getMe()
      .then((res) => active && setAuth(res.data))
      .catch(() => active && setAuth(null))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback((returnPath = "/dashboard") => {
    window.location.href = ssoLoginUrl(returnPath);
  }, []);

  const logout = useCallback(() => {
    setAuth(null);
    window.location.href = ssoLogoutUrl();
  }, []);

  return (
    <AuthContext.Provider value={{ auth, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
