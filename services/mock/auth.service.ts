import type { Role, User } from '@/lib/roles';
import { users } from '@/services/mock/users.service';

let currentUser: User | null = null;
const STORAGE_KEY = 'tf_current_user';

export const getCurrentUser = (): User | null => {
  if (typeof window === 'undefined') return currentUser;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      currentUser = JSON.parse(raw) as User;
    }
  } catch {
  }
  return currentUser;
};

export const login = (email: string, roleOverride?: Role): Promise<User> =>
  new Promise((resolve, reject) => {
    const base = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
    if (!base) {
      reject(new Error('Credenciales inválidas'));
      return;
    }
    const u: User = { ...base, role: roleOverride ?? base.role };
    currentUser = u;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    }
    setTimeout(() => resolve(u), 400);
  });

export const logout = (): Promise<void> =>
  new Promise((resolve) => {
    currentUser = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    setTimeout(() => resolve(), 200);
  });
