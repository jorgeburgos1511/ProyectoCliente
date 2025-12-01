import type { User } from "@/lib/roles";
import { users } from "@/services/mock/users.service";

export type Project = {
  id: string;
  name: string;
  key: string;
  ownerId: string;
  members: string[]; 
};

let projects: Project[] = [
  { id: "p1", name: "TaskFlow", key: "TF", ownerId: "u1", members: ["u1", "u2"] },
  { id: "p2", name: "Website Redesign", key: "WR", ownerId: "u2", members: ["u2", "u3"] },
];

export const listProjects = (): Project[] => projects;

export const getProjectById = (id: string): Project | undefined =>
  projects.find((p) => p.id === id);

export const getOwner = (project: Project): User | undefined =>
  users.find((u) => u.id === project.ownerId);

export const getMembers = (project: Project): User[] =>
  users.filter((u) => project.members.includes(u.id));


export const createProject = (data: Omit<Project, "id">): Project => {
  const id = `p${projects.length + 1}`;
  const project: Project = { id, ...data };
  projects = [project, ...projects];
  return project;
};

export const updateProject = (id: string, patch: Partial<Omit<Project, "id">>): Project | undefined => {
  const idx = projects.findIndex((p) => p.id === id);
  if (idx === -1) return undefined;
  projects[idx] = { ...projects[idx], ...patch };
  return projects[idx];
};

export const deleteProject = (id: string): boolean => {
  const initial = projects.length;
  projects = projects.filter((p) => p.id !== id);
  return projects.length < initial;
};

export const addMemberToProject = (id: string, userId: string): Project | undefined => {
  const project = projects.find((p) => p.id === id);
  if (!project) return undefined;
  if (!project.members.includes(userId)) {
    project.members = [...project.members, userId];
  }
  return project;
};

export const removeMemberFromProject = (id: string, userId: string): Project | undefined => {
  const project = projects.find((p) => p.id === id);
  if (!project) return undefined;
  project.members = project.members.filter((m) => m !== userId);
  if (project.ownerId === userId) {
    project.ownerId = project.members[0] ?? project.ownerId;
  }
  return project;
};
