import type { User } from "@/lib/roles";

export type TaskStatus = "Todo" | "Doing" | "Done";
export type TaskPriority = "High" | "Medium" | "Low";

export type Task = {
  id: string;
  projectId: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
  dueDate?: string; 
  points?: number;
  tags?: string[];
  description?: string;
};

let tasks: Task[] = [
  {
    id: "t1",
    projectId: "p1",
    title: "Setup",
    status: "Todo",
    priority: "High",
    assigneeId: "u2",
    dueDate: "2025-07-31",
    points: 5,
    tags: ["setup", "infra"],
  },
  {
    id: "t2",
    projectId: "p1",
    title: "Landing pública",
    status: "Doing",
    priority: "Medium",
    assigneeId: "u3",
    dueDate: "2025-07-25",
    points: 3,
    tags: ["ui"],
  },
  {
    id: "t3",
    projectId: "p1",
    title: "Board Kanban",
    status: "Done",
    priority: "Low",
    assigneeId: "u1",
    dueDate: "2025-07-20",
    points: 2,
    tags: ["kanban"],
  },
  {
    id: "t4",
    projectId: "p2",
    title: "Reunión kickoff",
    status: "Todo",
    priority: "Low",
  },
];

export const listTasks = (projectId?: string): Task[] =>
  projectId ? tasks.filter((t) => t.projectId === projectId) : tasks;

export const getTaskById = (id: string): Task | undefined =>
  tasks.find((t) => t.id === id);

export const listStatuses = (): TaskStatus[] => ["Todo", "Doing", "Done"];

export const listPriorities = (): TaskPriority[] => ["High", "Medium", "Low"];


export const createTask = (data: Omit<Task, "id">): Task => {
  const id = `t${tasks.length + 1}`;
  const task: Task = { id, ...data };
  tasks = [task, ...tasks];
  return task;
};

export const updateTask = (id: string, patch: Partial<Omit<Task, "id">>): Task | undefined => {
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) return undefined;
  tasks[idx] = { ...tasks[idx], ...patch };
  return tasks[idx];
};

export const deleteTask = (id: string): boolean => {
  const initial = tasks.length;
  tasks = tasks.filter((t) => t.id !== id);
  return tasks.length < initial;
};

export const uniqueTagsByProject = (projectId: string): string[] => {
  const set = new Set<string>();
  listTasks(projectId).forEach((t) => (t.tags ?? []).forEach((tag) => set.add(tag)));
  return Array.from(set);
};
