"use client";

import * as React from "react";
import {
  fetchTasks,
  type Task,
  listStatuses,
  listPriorities,
  deleteTask,
} from "@/services/api/tasks.service";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/common/EmptyState";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { toast } from "@/lib/toast";

type Props = {
  projectId?: string;
  myUserId?: string;
  onCreate?: () => void;
  onEdit?: (task: Task) => void;
};

export default function TasksList({ projectId, myUserId, onCreate, onEdit }: Props) {
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState<string>("all");
  const [priority, setPriority] = React.useState<string>("all");

  const [pendingDelete, setPendingDelete] = React.useState<Task | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      const data = await fetchTasks({ projectId, assigneeId: myUserId });
      setTasks(data);
    } catch {
      toast.destructive("No se pudieron cargar tareas");
    }
  }, [projectId, myUserId]);

  React.useEffect(() => {
    load();
  }, [load]);

  const filtered = React.useMemo(() => {
    const term = q.trim().toLowerCase();
    return tasks.filter((t) => {
      const matchesQ = !term || t.title.toLowerCase().includes(term);
      const matchesStatus = status === "all" || t.status === status;
      const matchesPriority = priority === "all" || t.priority === priority;
      return matchesQ && matchesStatus && matchesPriority;
    });
  }, [tasks, q, status, priority]);

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteTask(pendingDelete.id);
      await load();
      toast.destructive("Eliminado", `${pendingDelete.title} se eliminó correctamente`);
    } catch {
      toast.destructive("No se pudo eliminar");
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  };

  if (!tasks.length) {
    return (
      <EmptyState
        title="Aún no hay tareas"
        description="Crea tu primera tarea o cambia los filtros."
        actionLabel="Crear tarea"
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
            placeholder="Buscar por título..."
            className="h-9 w-56 rounded-md border border-input bg-background px-3 text-sm"
          />
          <select
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">Estado: Todos</option>
            {listStatuses().map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="all">Prioridad: Todas</option>
            {listPriorities().map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <div className="text-xs text-muted-foreground">{filtered.length} resultado(s)</div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => {
            setQ("");
            setStatus("all");
            setPriority("all");
          }}>
            Limpiar filtros
          </Button>
          <Button onClick={onCreate}>Crear</Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th className="px-3 py-2 font-medium">Título</th>
              <th className="px-3 py-2 font-medium">Estado</th>
              <th className="px-3 py-2 font-medium">Prioridad</th>
              <th className="px-3 py-2 font-medium">Vence</th>
              <th className="px-3 py-2 font-medium">Puntos</th>
              <th className="px-3 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id} className="border-t">
                <td className="px-3 py-2">{t.title}</td>
                <td className="px-3 py-2">{t.status}</td>
                <td className="px-3 py-2">{t.priority}</td>
                <td className="px-3 py-2">
                  {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "-"}
                </td>
                <td className="px-3 py-2">{t.points ?? "-"}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => onEdit?.(t)}>
                      Editar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setPendingDelete(t)}>
                      Eliminar
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!filtered.length && (
              <tr>
                <td colSpan={6} className="px-3 py-8">
                  <EmptyState
                    title="Sin resultados"
                    description="Intenta limpiar filtros o crea una nueva tarea."
                    actionLabel="Crear tarea"
                    onAction={onCreate}
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        title="¿Deseas eliminar este registro?"
        description={pendingDelete ? `Eliminar ${pendingDelete.title}` : ""}
        confirmText="Sí, eliminar"
        cancelText="No"
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
        loading={deleting}
      />
    </div>
  );
}
