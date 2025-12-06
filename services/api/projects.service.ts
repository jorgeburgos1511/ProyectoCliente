import { getAuthToken } from "./auth.service";

export type Project = {
  id: string;
  name: string;
  key: string;
  ownerId: string;
  members: string[];
  createdAt?: string;
  dueDate?: string;
  completed?: boolean;
  // Opcionales para mostrar en tablas sin depender de fetchUsers()
  ownerName?: string;
  ownerEmail?: string;
};

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api";

function authHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

export async function fetchProjects(): Promise<Project[]> {
  const res = await fetch(`${BASE}/projects`, {
    method: "GET",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("No se pudieron obtener los proyectos");
  }
  const data = await res.json();
  return (data.projects ?? []) as Project[];
}

export async function fetchProject(id: string): Promise<Project> {
  const res = await fetch(`${BASE}/projects/${id}`, {
    method: "GET",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("No se pudo obtener el proyecto");
  }
  const data = await res.json();
  return data.project as Project;
}

export type CreateProjectInput = {
  name: string;
  key: string;
  dueDate?: string;
  members?: string[];
};

export async function createProject(
  input: CreateProjectInput
): Promise<Project> {
  const res = await fetch(`${BASE}/projects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error("No se pudo crear el proyecto");
  }
  const data = await res.json();
  return data.project as Project;
}

export async function updateProject(
  id: string,
  patch: Partial<Omit<Project, "id" | "ownerId">>
): Promise<Project> {
  const res = await fetch(`${BASE}/projects/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    throw new Error("No se pudo actualizar el proyecto");
  }
  const data = await res.json();
  return data.project as Project;
}

export async function deleteProject(id: string): Promise<void> {
  const res = await fetch(`${BASE}/projects/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
  });
  if (!res.ok) {
    throw new Error("No se pudo eliminar el proyecto");
  }
}
