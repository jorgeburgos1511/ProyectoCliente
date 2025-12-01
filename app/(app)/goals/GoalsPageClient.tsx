"use client";

import * as React from "react";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import GoalForm from "@/components/forms/GoalForm";
import EmptyState from "@/components/common/EmptyState";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import {
  fetchGoals,
  type Goal,
  deleteGoal,
} from "@/services/api/goals.service";
import { fetchProjects, type Project } from "@/services/api/projects.service";
import { toast } from "@/lib/toast";

export default function GoalsPageClient() {
  const [goals, setGoals] = React.useState<Goal[]>([]);
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Goal | null>(null);
  const [pendingDelete, setPendingDelete] = React.useState<Goal | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      const [gs, ps] = await Promise.all([fetchGoals(), fetchProjects()]);
      setGoals(gs);
      setProjects(ps);
    } catch {
      toast.destructive("No se pudieron cargar metas");
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const onCreate = () => {
    setEditing(null);
    setOpen(true);
  };

  const onEdit = (g: Goal) => {
    setEditing(g);
    setOpen(true);
  };

  const onSaved = (_g: Goal) => {
    toast.success(editing ? "Actualizado" : "Se creó correctamente");
    setOpen(false);
    setEditing(null);
    load();
  };

  const onDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteGoal(pendingDelete.id);
      toast.destructive("Eliminado", `${pendingDelete.title} se eliminó correctamente`);
      await load();
    } catch {
      toast.destructive("No se pudo eliminar");
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  };


  return (
    <div className="space-y-6">
      <Breadcrumbs />
      <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-bold tracking-tight">Metas</h1>
        <Button onClick={onCreate}>Crear meta</Button>
      </div>

      {!goals.length ? (
        <EmptyState
          title="Aún no hay metas"
          description="Crea tu primera meta para realizar seguimiento del progreso."
          actionLabel="Crear meta"
          onAction={onCreate}
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="px-3 py-2 font-medium">Título</th>
                <th className="px-3 py-2 font-medium">Progreso</th>
                <th className="px-3 py-2 font-medium">Proyecto</th>
                <th className="px-3 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {goals.map((g) => {
                const p = g.projectId ? projects.find((pr) => pr.id === g.projectId) : undefined;
                return (
                  <tr key={g.id} className="border-t">
                    <td className="px-3 py-2">{g.title}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span>{g.progress}%</span>
                        <div className="h-2 w-28 overflow-hidden rounded bg-muted">
                          <div
                            className="h-full bg-foreground/80"
                            style={{ width: `${Math.min(100, Math.max(0, g.progress))}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2">{p ? `${p.name} (${p.key})` : "-"}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => onEdit(g)}>
                          Editar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setPendingDelete(g)}>
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={(o) => (!o ? setOpen(false) : setOpen(true))}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar meta" : "Crear meta"}</DialogTitle>
          </DialogHeader>
          <GoalForm initial={editing ?? undefined} onSaved={onSaved} />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!pendingDelete}
        title="¿Deseas eliminar este registro?"
        description={pendingDelete ? `Eliminar "${pendingDelete.title}"` : ""}
        confirmText="Sí, eliminar"
        cancelText="No"
        onConfirm={onDelete}
        onCancel={() => setPendingDelete(null)}
        loading={deleting}
      />
    </div>
  );
}
