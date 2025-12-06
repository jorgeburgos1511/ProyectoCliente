"use client";

import * as React from "react";
import EmptyState from "@/components/common/EmptyState";
import { fetchAdminUsers, type AdminUser } from "@/services/api/users.service";
import type { Role } from "@/lib/roles";

type MinimalUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

type Props = {
  onCreate?: () => void;
  onEdit?: (user: MinimalUser) => void;
  refreshToken?: number;
};

export default function UsersTable({ onCreate, onEdit, refreshToken }: Props) {
  const [users, setUsers] = React.useState<AdminUser[]>([]);
  const [q, setQ] = React.useState("");
  const [role, setRole] = React.useState<Role | "all">("all");

  const load = React.useCallback(() => {
    fetchAdminUsers()
      .then((us) => setUsers(us))
      .catch(() => setUsers([]));
  }, []);

  React.useEffect(() => {
    load();
  }, [load, refreshToken]);

  const filtered = React.useMemo(() => {
    const term = q.trim().toLowerCase();
    return users.filter((u) => {
      const matchesQ =
        !term ||
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term);
      const matchesRole = role === "all" || u.role === role;
      return matchesQ && matchesRole;
    });
  }, [users, q, role]);

  if (!users.length) {
    return (
      <EmptyState
        title="Sin usuarios"
        description="Usa el seed de admin y registra usuarios. Para cambiar rol, edita un usuario existente."
        actionLabel="Crear usuario (mock)"
        onAction={onCreate}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre o correo..."
            className="h-9 w-64 rounded-md border border-input bg-background px-3 text-sm"
          />
          <select
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            value={role}
            onChange={(e) => setRole(e.target.value as Role | "all")}
          >
            <option value="all">Rol: Todos</option>
            <option value="admin">admin</option>
            <option value="manager">manager</option>
            <option value="developer">developer</option>
          </select>
          <div className="text-xs text-muted-foreground">{filtered.length} resultado(s)</div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th className="px-3 py-2 font-medium">Nombre</th>
              <th className="px-3 py-2 font-medium">Correo</th>
              <th className="px-3 py-2 font-medium">Rol</th>
              <th className="px-3 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="px-3 py-2">{u.name}</td>
                <td className="px-3 py-2">{u.email}</td>
                <td className="px-3 py-2">{u.role}</td>
                <td className="px-3 py-2">
                  <button
                    className="rounded border px-2 py-1 text-xs"
                    onClick={() => onEdit?.(u)}
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
            {!filtered.length && (
              <tr>
                <td colSpan={4} className="px-3 py-8">
                  <EmptyState
                    title="Sin resultados"
                    description="Intenta limpiar los filtros."
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
