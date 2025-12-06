export type Role = 'admin' | 'manager' | 'developer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export const isAdmin = (user?: User | null) => user?.role === 'admin';
export const isManager = (user?: User | null) => user?.role === 'manager';
export const isDeveloper = (user?: User | null) => user?.role === 'developer';

export const hasAnyRole = (user: User | null, roles: Role[]) =>
  !!user && roles.includes(user.role);

export type ProtectedRouteOptions = {
  requireRole?: Role | Role[];
};

export const canAccess = (user: User | null, options?: ProtectedRouteOptions) => {
  if (!options?.requireRole) return true;
  const required = Array.isArray(options.requireRole)
    ? options.requireRole
    : [options.requireRole];
  return hasAnyRole(user, required);
};
