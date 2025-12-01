export type Goal = {
  id: string;
  title: string;
  progress: number; 
  projectId?: string;
  ownerId?: string;
};

let goals: Goal[] = [
  { id: "g1", title: "Mejorar throughput", progress: 40, projectId: "p1" },
  { id: "g2", title: "Reducir bugs críticos", progress: 20, projectId: "p1" },
  { id: "g3", title: "Incrementar adopción del tablero", progress: 70, projectId: "p2" },
];

export const listGoals = (projectId?: string): Goal[] =>
  projectId ? goals.filter((g) => g.projectId === projectId) : goals;

export const getGoalById = (id: string): Goal | undefined =>
  goals.find((g) => g.id === id);


export const createGoal = (data: Omit<Goal, "id">): Goal => {
  const id = `g${goals.length + 1}`;
  const goal: Goal = { id, ...data };
  goals = [goal, ...goals];
  return goal;
};

export const updateGoal = (id: string, patch: Partial<Omit<Goal, "id">>): Goal | undefined => {
  const idx = goals.findIndex((g) => g.id === id);
  if (idx === -1) return undefined;
  goals[idx] = { ...goals[idx], ...patch };
  return goals[idx];
};

export const deleteGoal = (id: string): boolean => {
  const initial = goals.length;
  goals = goals.filter((g) => g.id !== id);
  return goals.length < initial;
};
