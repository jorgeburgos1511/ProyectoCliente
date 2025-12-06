"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import TasksList from "@/components/tables/TasksList";
import TaskForm from "@/components/forms/TaskForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Task } from "@/services/api/tasks.service";

export default function ProjectTasksListPage() {
  const params = useParams<{ id: string }>();
  const projectId = (params?.id as string) ?? "p1";

  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Task | null>(null);
  const [refreshKey, setRefreshKey] = React.useState(0);

  const onCreate = () => {
    setEditing(null);
    setOpen(true);
  };

  const onEdit = (task: Task) => {
    setEditing(task);
    setOpen(true);
  };

  const onSaved = () => {
    setOpen(false);
    setEditing(null);
    setRefreshKey((k) => k + 1); // fuerza remount de TasksList para recargar
  };

  return (
    <div className="space-y-4">
      <TasksList
        key={refreshKey}
        projectId={projectId}
        onCreate={onCreate}
        onEdit={onEdit}
      />

      <Dialog open={open} onOpenChange={(o) => (!o ? setOpen(false) : setOpen(true))}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar tarea" : "Crear tarea"}</DialogTitle>
          </DialogHeader>
          <TaskForm projectId={projectId} initial={editing ?? undefined} onSaved={onSaved} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
