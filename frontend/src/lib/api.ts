const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

interface RequestOptions extends RequestInit {
  token?: string;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { token, headers, ...rest } = opts;
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...rest,
  });
  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined") {
      sessionStorage.removeItem("auth");
      window.location.href = "/";
      throw new Error("Sessionen har gatt ut");
    }
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

// --- Auth ---
export type UserRole = "admin" | "editor" | "viewer";

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  role: UserRole;
  expiresIn: number;
}

export function login(username: string, password: string) {
  return request<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

// --- Generic CRUD ---
export function get<T>(path: string, token: string) {
  return request<T>(path, { token });
}

export function post<T>(path: string, body: unknown, token: string) {
  return request<T>(path, { method: "POST", body: JSON.stringify(body), token });
}

export function patch<T>(path: string, body: unknown, token: string) {
  return request<T>(path, { method: "PATCH", body: JSON.stringify(body), token });
}

export function del(path: string, token: string) {
  return request<void>(path, { method: "DELETE", token });
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
  riktighet: number;
  tillganglighet: number;
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

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  name?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pages: number;
}
