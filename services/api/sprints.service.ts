import { getAuthToken } from "./auth.service";

export type Sprint = {
  id: string;
  projectId: string;
  name: string;
  startDate: string; // ISO
  endDate: string;   // ISO
  goal?: string;
  completed?: boolean;
  members?: string[]; // usuarios asignados al sprint
};

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api";

function authHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

export async function fetchSprints(params?: { projectId?: string }): Promise<Sprint[]> {
  const url = new URL(`${BASE}/sprints`);
  if (params?.projectId) url.searchParams.set("projectId", params.projectId);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("No se pudieron obtener los sprints");
  }

  const data = await res.json();
  return (data.sprints ?? []) as Sprint[];
}

export async function createSprint(
  input: Omit<Sprint, "id">
): Promise<Sprint> {
  const res = await fetch(`${BASE}/sprints`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    throw new Error("No se pudo crear el sprint");
  }

  const data = await res.json();
  return data.sprint as Sprint;
}

export async function updateSprint(
  id: string,
  patch: Partial<Omit<Sprint, "id">>
): Promise<Sprint> {
  const res = await fetch(`${BASE}/sprints/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(patch),
  });

  if (!res.ok) {
    throw new Error("No se pudo actualizar el sprint");
  }

  const data = await res.json();
  return data.sprint as Sprint;
}

export async function deleteSprint(id: string): Promise<void> {
  const res = await fetch(`${BASE}/sprints/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
  });

  if (!res.ok) {
    throw new Error("No se pudo eliminar el sprint");
  }
}
