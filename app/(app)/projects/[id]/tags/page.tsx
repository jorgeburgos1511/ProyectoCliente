"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/common/EmptyState";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { fetchTasks, updateTask, type Task } from "@/services/api/tasks.service";
import { toast } from "@/lib/toast";

function TagChip({
  tag,
  onRemove,
}: {
  tag: string;
  onRemove?: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
      #{tag}
      {onRemove && (
        <button
          className="ml-1 rounded px-1 text-[10px] hover:bg-muted-foreground/10"
          onClick={(e) => {
            e.preventDefault();
            onRemove();
          }}
          aria-label={`Quitar etiqueta ${tag}`}
          title="Quitar"
        >
          ✕
        </button>
      )}
    </span>
  );
}

export default function ProjectTagsPage() {
  const params = useParams<{ id: string }>();
  const projectId = (params?.id as string) ?? "p1";

  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [pendingClear, setPendingClear] = React.useState<Task | null>(null);
  const [clearing, setClearing] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTasks({ projectId });
      setTasks(data);
    } catch {
      toast.destructive("No se pudieron cargar tareas");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  React.useEffect(() => {
    load();
  }, [load]);

  const addTag = async (task: Task, tag: string) => {
    const t = tag.trim();
    if (!t) return;
    if (t.length > 24) {
      toast.destructive("Etiqueta muy larga (máx 24)");
      return;
    }
    // simple validación: letras, números y guiones
    if (!/^[a-z0-9-]+$/i.test(t)) {
      toast.destructive("Usa solo letras, números y guiones");
      return;
    }
    const nextTags = Array.from(new Set([...(task.tags ?? []), t]));
    try {
      await updateTask(task.id, { tags: nextTags });
      toast.success(`Etiqueta #${t} agregada`);
      load();
    } catch {
      toast.destructive("No se pudo agregar etiqueta");
    }
  };

  const removeTag = async (task: Task, tag: string) => {
    const nextTags = (task.tags ?? []).filter((x) => x !== tag);
    try {
      await updateTask(task.id, { tags: nextTags });
      toast.info(`Etiqueta #${tag} quitada`);
      load();
    } catch {
      toast.destructive("No se pudo quitar etiqueta");
    }
  };

  const clearAllTags = async () => {
    if (!pendingClear) return;
    setClearing(true);
    try {
      await updateTask(pendingClear.id, { tags: [] });
      toast.info("Etiquetas eliminadas");
      setPendingClear(null);
      load();
    } catch {
      toast.destructive("No se pudieron eliminar etiquetas");
    } finally {
      setClearing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Breadcrumbs />
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="size-10 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-bold tracking-tight">Etiquetas</h1>
        <p className="text-sm text-muted-foreground">
          Clasifica tareas agregando o quitando etiquetas
        </p>
      </div>

      {!tasks.length ? (
        <EmptyState
          title="Aún no hay tareas"
          description="Crea una tarea para este proyecto y luego clasifícala con etiquetas."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="px-3 py-2 font-medium">Tarea</th>
                <th className="px-3 py-2 font-medium">Etiquetas</th>
                <th className="px-3 py-2 font-medium">Agregar etiqueta</th>
                <th className="px-3 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => (
                <tr key={t.id} className="border-t align-top">
                  <td className="px-3 py-3">
                    <div className="font-medium">{t.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {t.status} • {t.priority}
                      {t.dueDate ? ` • vence ${new Date(t.dueDate).toLocaleDateString()}` : ""}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-2">
                      {(t.tags ?? []).length ? (
                        (t.tags ?? []).map((tag) => (
                          <TagChip key={tag} tag={tag} onRemove={() => removeTag(t, tag)} />
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">Sin etiquetas</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <form
                      className="flex items-center gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const form = e.currentTarget as HTMLFormElement & {
                          tag: { value: string };
                        };
                        const value = (form.tag?.value ?? "").trim();
                        if (value) {
                          addTag(t, value);
                          form.tag.value = "";
                        }
                      }}
                    >
                      <input
                        name="tag"
                        placeholder="bug, ui, alta..."
                        className="h-8 w-40 rounded-md border border-input bg-background px-2 text-xs"
                      />
                      <Button type="submit" size="sm">
                        Agregar
                      </Button>
                    </form>
                  </td>
                  <td className="px-3 py-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPendingClear(t)}
                      title="Quitar todas las etiquetas"
                    >
                      Limpiar etiquetas
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!pendingClear}
        title="¿Quitar todas las etiquetas?"
        description={
          pendingClear
            ? `Se eliminarán todas las etiquetas de "${pendingClear.title}".`
            : ""
        }
        confirmText="Sí, quitar"
        cancelText="Cancelar"
        onConfirm={clearAllTags}
        onCancel={() => setPendingClear(null)}
        loading={clearing}
      />
    </div>
  );
}
