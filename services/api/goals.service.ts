import { getAuthToken } from "./auth.service";

export type Goal = {
  id: string;
  title: string;
  progress: number; // 0..100
  projectId?: string;
  ownerId?: string;
  dueDate?: string;
};

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api";

function authHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

export async function fetchGoals(params?: { projectId?: string }): Promise<Goal[]> {
  const url = new URL(`${BASE}/goals`);
  if (params?.projectId) url.searchParams.set("projectId", params.projectId);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("No se pudieron obtener las metas");
  }

  const data = await res.json();
  return (data.goals ?? []) as Goal[];
}

export async function createGoal(input: Omit<Goal, "id">): Promise<Goal> {
  const res = await fetch(`${BASE}/goals`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    throw new Error("No se pudo crear la meta");
  }

  const data = await res.json();
  return data.goal as Goal;
}

export async function updateGoal(
  id: string,
  patch: Partial<Omit<Goal, "id">>
): Promise<Goal> {
  const res = await fetch(`${BASE}/goals/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(patch),
  });

  if (!res.ok) {
    throw new Error("No se pudo actualizar la meta");
  }

  const data = await res.json();
  return data.goal as Goal;
}

export async function deleteGoal(id: string): Promise<void> {
  const res = await fetch(`${BASE}/goals/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
  });

  if (!res.ok) {
    throw new Error("No se pudo eliminar la meta");
  }
}
