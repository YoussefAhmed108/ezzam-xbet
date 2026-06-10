// Default to the same host the app is served from (port 8000) so it works on
// localhost and over the LAN without hard-coding an IP. Override with VITE_API_URL.
const API_URL =
  import.meta.env.VITE_API_URL ||
  `${window.location.protocol}//${window.location.hostname}:8000`;

const TOKEN_KEY = "wc2026_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
}

export async function apiFetch<T>(
  path: string,
  { method = "GET", body, auth = true }: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const resp = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (resp.status === 204) {
    return undefined as T;
  }

  const data = await resp.json().catch(() => null);

  if (!resp.ok) {
    const detail =
      (data && (data.detail as string)) || resp.statusText || "Request failed";
    if (resp.status === 401) clearToken();
    throw new ApiError(
      typeof detail === "string" ? detail : "Request failed",
      resp.status,
    );
  }

  return data as T;
}
