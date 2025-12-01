"use client";

import * as React from "react";
import { fetchProjects, deleteProject, type Project } from "@/services/api/projects.service";
import { fetchUsers, type SimpleUser } from "@/services/api/users-public.service";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import EmptyState from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import Link from "next/link";

type Props = {
  onCreate?: () => void;
  onEdit?: (project: Project) => void;
  refreshAt?: number;
};

export default function ProjectsTable({ onCreate, onEdit, refreshAt }: Props) {
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [users, setUsers] = React.useState<SimpleUser[]>([]);
  const [q, setQ] = React.useState("");
  const [page, setPage] = React.useState(1);
  const pageSize = 5;

  const [pendingDelete, setPendingDelete] = React.useState<Project | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      const [ps, us] = await Promise.all([fetchProjects(), fetchUsers()]);
      setProjects(ps);
      setUsers(us);
    } catch {
      toast.destructive("No se pudieron cargar proyectos");
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load, refreshAt]);

  const filtered = React.useMemo(() => {
    const term = q.trim().toLowerCase();
    const data = term
      ? projects.filter(
          (p) =>
            p.name.toLowerCase().includes(term) ||
            p.key.toLowerCase().includes(term)
        )
      : projects;
    return data;
  }, [projects, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteProject(pendingDelete.id);
      await load();
      toast.destructive("Eliminado", `${pendingDelete.name} se eliminó correctamente`);
    } catch {
      toast.destructive("No se pudo eliminar");
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  };

  if (!projects.length) {
    return (
      <EmptyState
        title="Aún no hay proyectos"
        description="Crea tu primer proyecto para comenzar a organizar el trabajo."
        actionLabel="Crear proyecto"
        onAction={onCreate}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => {
              setPage(1);
              setQ(e.target.value);
            }}
            placeholder="Buscar por nombre o clave..."
            className="h-9 w-64 rounded-md border border-input bg-background px-3 text-sm"
          />
          <div className="text-xs text-muted-foreground">
            {filtered.length} resultado(s)
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => load()}>
            Refrescar
          </Button>
          <Button onClick={onCreate}>Crear</Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th className="px-3 py-2 font-medium">Proyecto</th>
              <th className="px-3 py-2 font-medium">Clave</th>
              <th className="px-3 py-2 font-medium">Owner</th>
              <th className="px-3 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {current.map((p) => {
              const owner = users.find((u) => u.id === p.ownerId);
              return (
                <tr key={p.id} className="border-t">
                  <td className="px-3 py-2">
                    <Link href={`/projects/${p.id}/kanban`} className="underline underline-offset-2">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{p.key}</td>
                  <td className="px-3 py-2">{owner ? owner.name : "-"}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEdit?.(p)}
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPendingDelete(p)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!current.length && (
              <tr>
                <td colSpan={4} className="px-3 py-8">
                  <EmptyState
                    title="Sin resultados"
                    description="Intenta limpiar filtros o crea un nuevo proyecto."
                    actionLabel="Crear proyecto"
                    onAction={onCreate}
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination dummy */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          Página {page} de {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Anterior
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Siguiente
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        title="¿Deseas eliminar este registro?"
        description={pendingDelete ? `Eliminar ${pendingDelete.name} (${pendingDelete.key})` : ""}
        confirmText="Sí, eliminar"
        cancelText="No"
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
        loading={deleting}
      />
    </div>
  );
}
