const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

/** Kastas när BFF:en svarar 401 — sessionen finns inte eller har gått ut. */
export class UnauthenticatedError extends Error {
  constructor() {
    super("NOT_AUTHENTICATED");
    this.name = "UnauthenticatedError";
  }
}

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const { headers, ...rest } = opts;
  const res = await fetch(`${API_BASE}${path}`, {
    // Sessionscookien från SSO-inloggningen måste följa med varje anrop
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    ...rest,
  });
  if (!res.ok) {
    if (res.status === 401) {
      throw new UnauthenticatedError();
    }
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? body.error ?? `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// --- Auth / SSO ---
export type Role = "admin" | "editor" | "viewer";

export interface MeResponse {
  data: {
    username: string;
    name: string;
    givenName: string;
    surname: string;
    email: string;
    groups: string[];
    role: Role;
  };
}

/** Hämtar inloggad användare. Kastar UnauthenticatedError om sessionen saknas. */
export function getMe() {
  return request<MeResponse>("/me");
}

const currentOrigin = () =>
  typeof window !== "undefined" ? window.location.origin : "";

/**
 * SSO-inloggning sker med en full sidnavigering till BFF:en, som i sin tur
 * redirectar till kommunens IdP. successRedirect tar användaren tillbaka hit.
 */
export function ssoLoginUrl(returnPath = "/dashboard") {
  const params = new URLSearchParams({
    successRedirect: `${currentOrigin()}${returnPath}`,
    failureRedirect: `${currentOrigin()}/`,
  });
  return `${API_BASE}/saml/login?${params.toString()}`;
}

export function ssoLogoutUrl() {
  const params = new URLSearchParams({
    successRedirect: `${currentOrigin()}/`,
  });
  return `${API_BASE}/saml/logout?${params.toString()}`;
}

// --- Generic CRUD ---
export function get<T>(path: string) {
  return request<T>(path);
}

export function post<T>(path: string, body: unknown) {
  return request<T>(path, { method: "POST", body: JSON.stringify(body) });
}

export function patch<T>(path: string, body: unknown) {
  return request<T>(path, { method: "PATCH", body: JSON.stringify(body) });
}

export function del(path: string) {
  return request<void>(path, { method: "DELETE" });
}

// --- Shared types ---
export interface Organization {
  id: string;
  name: string;
  description?: string;
  orgNumber?: string;
  email?: string;
  phone?: string;
  parentId?: string;
  level?: number;
  parent?: { id: string; name: string };
  children?: { id: string; name: string }[];
}

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  title?: string;
  username?: string;
  organizationId?: string;
  Organization?: { id: string; name: string };
}

export interface Supplier {
  id: string;
  name: string;
  description?: string;
  orgNumber?: string;
  website?: string;
  contactEmail?: string;
  isActive: boolean;
}

export interface CriticalityLevel {
  id: string;
  name: string;
  level: number;
  color: string;
}

export interface System {
  id: string;
  systemId: string;
  name: string;
  description?: string;
  status: string;
  version?: string;
  documentationUrl?: string;
  hostingType?: string;
  konfidentialitet: number;
  konfidentialitetMotivering?: string;
  riktighet: number;
  riktighetMotivering?: string;
  tillganglighet: number;
  tillganglighetMotivering?: string;
  samhallsviktigt?: boolean;
  samhallsviktigtMotivering?: string;
  ownerOrg?: { id: string; name: string };
  systemOwner?: { id: string; firstName: string; lastName: string; email: string };
  technicalContact?: { id: string; firstName: string; lastName: string; email: string };
  Supplier?: Supplier;
  CriticalityLevel?: CriticalityLevel;
  Services?: Service[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Service {
  id: string;
  serviceId: string;
  name: string;
  description?: string;
  version?: string;
  endpointUrl?: string;
  serviceType: string;
  hostingType?: string;
  konfidentialitet: number;
  riktighet: number;
  tillganglighet: number;
  ownerOrg?: { id: string; name: string };
  Supplier?: { id: string; name: string };
  CriticalityLevel?: { id: string; name: string; level: number };
}

export interface PPB {
  id: string;
  behandlingId: string;
  name: string;
  description?: string;
  status: string;
  purposeDescription?: string;
  legalBasis?: string;
  processesSensitiveData: boolean;
  processesSsn: boolean;
  transfersToThirdCountry: boolean;
  dpiaRequired?: boolean;
  controller?: { id: string; name: string };
  dpo?: { id: string; firstName: string; lastName: string; email: string };
  SystemModels?: { id: string; name: string; systemId: string }[];
}

export interface AiApplication {
  id: string;
  aiApplicationId: string;
  name: string;
  description?: string;
  status: string;
  riskCategory?: string;
  highRiskArea?: string;
  friaCompleted: boolean;
  registrationStatus: string;
  SystemModel?: { id: string; name: string; systemId: string };
  ownerOrg?: { id: string; name: string };
  contact?: { id: string; firstName: string; lastName: string; email: string };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pages: number;
}
