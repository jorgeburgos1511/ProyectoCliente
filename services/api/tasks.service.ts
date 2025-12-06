import { getAuthToken } from "./auth.service";

export type TaskStatus = "Todo" | "Doing" | "Done";
export type TaskPriority = "High" | "Medium" | "Low";

export type Task = {
  id: string;
  projectId: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
  dueDate?: string; // ISO
  points?: number;
  tags?: string[];
  description?: string;
};

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api";

function authHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

export function listStatuses(): TaskStatus[] {
  return ["Todo", "Doing", "Done"];
}

export function listPriorities(): TaskPriority[] {
  return ["High", "Medium", "Low"];
}

export async function fetchTasks(params?: {
  projectId?: string;
  assigneeId?: string;
}): Promise<Task[]> {
  const url = new URL(`${BASE}/tasks`);
  if (params?.projectId) url.searchParams.set("projectId", params.projectId);
  if (params?.assigneeId) url.searchParams.set("assigneeId", params.assigneeId);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("No se pudieron obtener las tareas");
  }

  const data = await res.json();
  return (data.tasks ?? []) as Task[];
}

export async function createTask(
  input: Omit<Task, "id">
): Promise<Task> {
  const res = await fetch(`${BASE}/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    throw new Error("No se pudo crear la tarea");
  }

  const data = await res.json();
  return data.task as Task;
}

export async function updateTask(
  id: string,
  patch: Partial<Omit<Task, "id">>
): Promise<Task> {
  const res = await fetch(`${BASE}/tasks/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(patch),
  });

  if (!res.ok) {
    throw new Error("No se pudo actualizar la tarea");
  }

  const data = await res.json();
  return data.task as Task;
}

export async function deleteTask(id: string): Promise<void> {
  const res = await fetch(`${BASE}/tasks/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
  });

  if (!res.ok) {
    throw new Error("No se pudo eliminar la tarea");
  }
}
