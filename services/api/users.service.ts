import { getAuthToken } from "./auth.service";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "developer";
  provider: "credentials" | "google";
  createdAt: string;
};

function authHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: Record<string, string> = {};

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...authHeaders(),
  };

  const res = await fetch(`${BASE}/admin`, {
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("No se pudieron obtener los usuarios");
  }

  const data = await res.json();
  return data.users as AdminUser[];
}

export async function updateUserRole(
  userId: string,
  role: AdminUser["role"]
) {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...authHeaders(),
  };

  const res = await fetch(`${BASE}/admin`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ userId, role }),
  });

  if (!res.ok) {
    throw new Error("No se pudo actualizar el rol");
  }

  return res.json();
}
