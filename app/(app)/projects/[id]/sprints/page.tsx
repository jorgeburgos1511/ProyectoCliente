"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import SprintForm from "@/components/forms/SprintForm";
import EmptyState from "@/components/common/EmptyState";
import {
  fetchSprints,
  type Sprint,
  deleteSprint,
  updateSprint,
} from "@/services/api/sprints.service";
import {
  fetchTasks,
  updateTask,
  type Task,
} from "@/services/api/tasks.service";
import { toast } from "@/lib/toast";

export default function ProjectSprintsPage() {
  const params = useParams<{ id: string }>();
  const projectId = (params?.id as string) ?? "p1";

  const [sprints, setSprints] = React.useState<Sprint[]>([]);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Sprint | null>(null);
  const [pendingDelete, setPendingDelete] = React.useState<Sprint | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  // Manage sprint tasks
  const [manageOpen, setManageOpen] = React.useState(false);
  const [manageSprint, setManageSprint] = React.useState<Sprint | null>(null);
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = React.useState(false);

  const loadSprints = React.useCallback(async () => {
    try {
      const data = await fetchSprints({ projectId });
      setSprints(data);
    } catch {
      toast.destructive("No se pudieron cargar sprints");
    }
  }, [projectId]);

  const loadTasks = React.useCallback(async () => {
    setLoadingTasks(true);
    try {
      const data = await fetchTasks({ projectId });
      setTasks(data);
    } catch {
      toast.destructive("No se pudieron cargar tareas");
    } finally {
      setLoadingTasks(false);
    }
  }, [projectId]);

  React.useEffect(() => {
    loadSprints();
  }, [loadSprints]);

  const onCreate = () => {
    setEditing(null);
    setOpen(true);
  };

  const onEdit = (s: Sprint) => {
    setEditing(s);
    setOpen(true);
  };

  const onSaved = () => {
    toast.success(editing ? "Actualizado" : "Se creó correctamente");
    setOpen(false);
    setEditing(null);
    loadSprints();
  };

  const onDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteSprint(pendingDelete.id);
      toast.destructive("Eliminado", `${pendingDelete.name} se eliminó correctamente`);
      await loadSprints();
    } catch {
      toast.destructive("No se pudo eliminar");
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  };

  const openManageTasks = async (s: Sprint) => {
    setManageSprint(s);
    setManageOpen(true);
    await loadTasks();
  };

  const sprintTag = (sId: string) => `sprint-${sId}`;

  const isInSprint = (t: Task, s: Sprint | null) => {
    if (!s) return false;
    const tag = sprintTag(s.id);
    return (t.tags ?? []).includes(tag);
    }

  const toggleTaskInSprint = async (t: Task, s: Sprint | null) => {
    if (!s) return;
    const tag = sprintTag(s.id);
    const inSprint = (t.tags ?? []).includes(tag);
    const nextTags = inSprint
      ? (t.tags ?? []).filter((x) => x !== tag)
      : Array.from(new Set([...(t.tags ?? []), tag]));

    try {
      await updateTask(t.id, { tags: nextTags });
      await loadTasks();
      toast.info(
        inSprint ? `Quitada de "${s.name}"` : `Agregada a "${s.name}"`
      );
    } catch {
      toast.destructive("No se pudo actualizar la tarea");
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-bold tracking-tight">Sprints</h1>
        <Button onClick={onCreate}>Crear sprint</Button>
      </div>

      {!sprints.length ? (
        <EmptyState
          title="Aún no hay sprints"
          description="Crea tu primer sprint para planificar el trabajo."
          actionLabel="Crear sprint"
          onAction={onCreate}
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="px-3 py-2 font-medium">Nombre</th>
                <th className="px-3 py-2 font-medium">Inicio</th>
                <th className="px-3 py-2 font-medium">Fin</th>
                <th className="px-3 py-2 font-medium">Objetivo</th>
                <th className="px-3 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {sprints.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="px-3 py-2">{s.name}</td>
                  <td className="px-3 py-2">
                    {new Date(s.startDate).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2">
                    {new Date(s.endDate).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2">{s.goal ?? "-"}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={s.completed ? "outline" : "default"}
                        onClick={async () => {
                          try {
                            await updateSprint(s.id, { completed: !s.completed });
                            await loadSprints();
                            try {
                              window.dispatchEvent(new Event("calendar:refresh"));
                            } catch {}
                            if (!s.completed) {
                              toast.success("Sprint finalizado");
                            } else {
                              toast.info("Sprint reabierto");
                            }
                          } catch {
                            toast.destructive("No se pudo actualizar el sprint");
                          }
                        }}
                        title={s.completed ? "Reabrir sprint" : "Marcar como finalizado"}
                      >
                        {s.completed ? "Reabrir" : "Finalizar"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => onEdit(s)}>
                        Editar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setPendingDelete(s)}>
                        Eliminar
                      </Button>
                      <Button size="sm" onClick={() => openManageTasks(s)}>
                        Administrar tareas
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={(o) => (!o ? setOpen(false) : setOpen(true))}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar sprint" : "Crear sprint"}</DialogTitle>
          </DialogHeader>
          <SprintForm projectId={projectId} initial={editing ?? undefined} onSaved={onSaved} />
        </DialogContent>
      </Dialog>

      {/* Manage tasks in sprint */}
      <Dialog open={manageOpen} onOpenChange={(o) => (!o ? setManageOpen(false) : setManageOpen(true))}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>
              {manageSprint ? `Tareas en sprint: ${manageSprint.name}` : "Tareas del sprint"}
            </DialogTitle>
          </DialogHeader>

          {!manageSprint ? (
            <div className="text-sm text-muted-foreground">No hay sprint seleccionado.</div>
          ) : loadingTasks ? (
            <div className="flex min-h-[20vh] items-center justify-center">
              <div className="size-10 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-muted-foreground" />
            </div>
          ) : !tasks.length ? (
            <EmptyState
              title="Aún no hay tareas"
              description="Crea tareas en la pestaña Lista para este proyecto."
            />
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="text-left">
                    <th className="px-3 py-2 font-medium">Tarea</th>
                    <th className="px-3 py-2 font-medium">Estado</th>
                    <th className="px-3 py-2 font-medium">Prioridad</th>
                    <th className="px-3 py-2 font-medium">Vence</th>
                    <th className="px-3 py-2 font-medium">En sprint</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((t) => {
                    const checked = isInSprint(t, manageSprint);
                    return (
                      <tr key={t.id} className="border-t">
                        <td className="px-3 py-2">{t.title}</td>
                        <td className="px-3 py-2">{t.status}</td>
                        <td className="px-3 py-2">{t.priority}</td>
                        <td className="px-3 py-2">
                          {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "-"}
                        </td>
                        <td className="px-3 py-2">
                          <label className="inline-flex items-center gap-2 text-xs">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleTaskInSprint(t, manageSprint)}
                            />
                            {checked ? "Asignada" : "No asignada"}
                          </label>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="mt-3 text-xs text-muted-foreground">
                Nota: la asignación se guarda como etiqueta interna ({`sprint-<id>`}) en cada tarea.
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!pendingDelete}
        title="¿Deseas eliminar este registro?"
        description={pendingDelete ? `Eliminar "${pendingDelete.name}"` : ""}
        confirmText="Sí, eliminar"
        cancelText="No"
        onConfirm={onDelete}
        onCancel={() => setPendingDelete(null)}
        loading={deleting}
      />
    </div>
  );
}
