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
import TagForm from "@/components/forms/TagForm";
import EmptyState from "@/components/common/EmptyState";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { uniqueTagsByProject } from "@/services/mock/tasks.service";
import { toast } from "@/lib/toast";

export default function ProjectTagsPage() {
  const params = useParams<{ id: string }>();
  const projectId = (params?.id as string) ?? "p1";

  const [tags, setTags] = React.useState<string[]>([]);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<{ name: string } | null>(null);
  const [pendingDelete, setPendingDelete] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  React.useEffect(() => {
    setTags(uniqueTagsByProject(projectId));
  }, [projectId]);

  const onCreate = () => {
    setEditing(null);
    setOpen(true);
  };

  const onEdit = (name: string) => {
    setEditing({ name });
    setOpen(true);
  };

  const onSaved = (t: { name: string }) => {
    setOpen(false);
    setEditing(null);
    setTags((prev) => {
      const next = new Set(prev);
      if (editing && editing.name !== t.name) {
        next.delete(editing.name);
      }
      next.add(t.name);
      return Array.from(next).sort((a, b) => a.localeCompare(b));
    });
    toast.success(editing ? "Actualizado" : "Se creó correctamente");
  };

  const onDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);

    setTimeout(() => {
      setTags((prev) => prev.filter((x) => x !== pendingDelete));
      toast.destructive("Eliminado", `Etiqueta "${pendingDelete}" eliminada`);
      setPendingDelete(null);
      setDeleting(false);
    }, 250);
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-bold tracking-tight">Etiquetas</h1>
        <Button onClick={onCreate}>Crear etiqueta</Button>
      </div>

      {!tags.length ? (
        <EmptyState
          title="Aún no hay etiquetas"
          description="Crea etiquetas para clasificar tareas (p. ej. bug, ui, alta)."
          actionLabel="Crear etiqueta"
          onAction={onCreate}
        />
      ) : (
        <div className="rounded-lg border bg-card p-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {tags.map((t) => (
              <div
                key={t}
                className="flex items-center justify-between gap-3 rounded border px-3 py-2 text-sm"
              >
                <span className="inline-flex items-center gap-2">
                  <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    #{t}
                  </span>
                </span>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => onEdit(t)}>
                    Editar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setPendingDelete(t)}>
                    Eliminar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={(o) => (!o ? setOpen(false) : setOpen(true))}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar etiqueta" : "Crear etiqueta"}</DialogTitle>
          </DialogHeader>
          <TagForm initial={editing ?? undefined} onSaved={onSaved} />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!pendingDelete}
        title="¿Deseas eliminar este registro?"
        description={pendingDelete ? `Eliminar etiqueta "${pendingDelete}"` : ""}
        confirmText="Sí, eliminar"
        cancelText="No"
        onConfirm={onDelete}
        onCancel={() => setPendingDelete(null)}
        loading={deleting}
      />
    </div>
  );
}
