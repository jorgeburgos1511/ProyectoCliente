import type { Role, User } from '@/lib/roles';

export const users: User[] = [
  { id: 'u1', name: 'Ana', email: 'ana@demo.io', role: 'admin' },
  { id: 'u2', name: 'Bruno', email: 'bruno@demo.io', role: 'manager' },
  { id: 'u3', name: 'Carla', email: 'carla@demo.io', role: 'developer' },
  { id: 'u4', name: 'Diego', email: 'diego@demo.io', role: 'developer' },
];

export const listUsers = (): User[] => users;

export const getUserById = (id: string): User | undefined =>
  users.find((u) => u.id === id);

export const getUserByEmail = (email: string): User | undefined =>
  users.find((u) => u.email.toLowerCase() === email.toLowerCase());

export const filterByRole = (role: Role): User[] =>
  users.filter((u) => u.role === role);
