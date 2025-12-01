const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api";

export type SimpleUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "developer";
};

export async function fetchUsers(): Promise<SimpleUser[]> {
  const res = await fetch(`${BASE}/users`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("No se pudieron obtener los usuarios");
  }
  const data = await res.json();
  return (data.users ?? []) as SimpleUser[];
}
