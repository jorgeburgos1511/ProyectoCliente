export type Sprint = {
  id: string;
  projectId: string;
  name: string;
  startDate: string; 
  endDate: string; 
  goal?: string;
};

let sprints: Sprint[] = [
  { id: "s1", projectId: "p1", name: "Sprint 1", startDate: "2025-07-01", endDate: "2025-07-15" },
  { id: "s2", projectId: "p1", name: "Sprint 2", startDate: "2025-07-16", endDate: "2025-07-31" },
  { id: "s3", projectId: "p2", name: "Kickoff", startDate: "2025-07-05", endDate: "2025-07-19" },
];

export const listSprints = (projectId?: string): Sprint[] =>
  projectId ? sprints.filter((s) => s.projectId === projectId) : sprints;

export const getSprintById = (id: string): Sprint | undefined =>
  sprints.find((s) => s.id === id);


export const createSprint = (data: Omit<Sprint, "id">): Sprint => {
  const id = `s${sprints.length + 1}`;
  const sprint: Sprint = { id, ...data };
  sprints = [sprint, ...sprints];
  return sprint;
};

export const updateSprint = (id: string, patch: Partial<Omit<Sprint, "id">>): Sprint | undefined => {
  const idx = sprints.findIndex((s) => s.id === id);
  if (idx === -1) return undefined;
  sprints[idx] = { ...sprints[idx], ...patch };
  return sprints[idx];
};

export const deleteSprint = (id: string): boolean => {
  const initial = sprints.length;
  sprints = sprints.filter((s) => s.id !== id);
  return sprints.length < initial;
};
