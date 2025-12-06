import { getAuthToken } from "./auth.service";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api";

export type SimpleUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "developer";
};

function authHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

/**
 * Retorna usuarios que el solicitante puede ver:
 * - Admin: todos
 * - Manager: solo developers de su mismo dominio (servidor filtra)
 * - Developer: 403 (no autorizado)
 */
export async function fetchUsers(params?: { role?: "developer"; domain?: string }): Promise<SimpleUser[]> {
  const url = new URL(`${BASE}/users`);
  if (params?.role) url.searchParams.set("role", params.role);
  if (params?.domain) url.searchParams.set("domain", params.domain);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: authHeaders(),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("No se pudieron obtener los usuarios");
  }
  const data = await res.json();
  return (data.users ?? []) as SimpleUser[];
}
