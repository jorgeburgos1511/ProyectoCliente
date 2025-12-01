import type { User } from "@/lib/roles";

export type LoginResponse = {
  user: User;
  token: string;
};

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api";

const TOKEN_KEY = "taskflow_token";

export function setAuthToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
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
  return data;
}
