import type { User } from "@/lib/roles";

export type LoginResponse = {
  user: User;
  token: string;
};

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api";

const TOKEN_KEY = "taskflow_token";
const USER_KEY = "taskflow_user";

export function setAuthToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthUser(user: User | null) {
  if (typeof window === "undefined") return;
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
}

export function getAuthUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export async function loginWithCredentials(
  email: string,
  password: string
): Promise<LoginResponse> {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    throw new Error("Credenciales inválidas");
  }

  const data = (await res.json()) as LoginResponse;
  setAuthToken(data.token);
  setAuthUser(data.user);
  return data;
}

export async function registerAccount(
  name: string,
  email: string,
  password: string
): Promise<LoginResponse> {
  const res = await fetch(`${BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });

  if (!res.ok) {
    throw new Error("No fue posible registrar la cuenta");
  }

  const data = (await res.json()) as LoginResponse;
  setAuthToken(data.token);
  setAuthUser(data.user);
  return data;
}

export async function loginWithGoogleAuthCode(
  code: string
): Promise<LoginResponse> {
  const res = await fetch(`${BASE}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });

  if (!res.ok) {
    throw new Error("No fue posible iniciar sesión con Google");
  }

  const data = (await res.json()) as LoginResponse;
  setAuthToken(data.token);
  setAuthUser(data.user);
  return data;
}
