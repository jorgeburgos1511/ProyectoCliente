"use client";

import * as React from "react";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import ProjectsTable from "@/components/tables/ProjectsTable";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ProjectForm from "@/components/forms/ProjectForm";
import type { Project } from "@/services/api/projects.service";
import { toast } from "@/lib/toast";
import { useAuth } from "@/components/providers/AuthProvider";
import { isDeveloper } from "@/lib/roles";

export default function ProjectsPageClient() {
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Project | null>(null);
  const [refreshTick, setRefreshTick] = React.useState(0);
  const { user } = useAuth();

  const onCreate = () => {
    setEditing(null);
    setOpen(true);
  };

  const onEdit = (project: Project) => {
    setEditing(project);
    setOpen(true);
  };

  const onSaved = (p: Project) => {
    toast.success(editing ? "Actualizado" : "Se creó correctamente");
    setOpen(false);
    setEditing(null);
    setRefreshTick((t) => t + 1);
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-bold tracking-tight">Proyectos</h1>
        {!isDeveloper(user) && <Button onClick={onCreate}>Crear proyecto</Button>}
      </div>

      <ProjectsTable onCreate={onCreate} onEdit={onEdit} refreshAt={refreshTick} />

      {!isDeveloper(user) && (
        <Dialog open={open} onOpenChange={(o) => (!o ? setOpen(false) : setOpen(true))}>
          <DialogContent className="sm:max-w-[640px]">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar proyecto" : "Crear proyecto"}</DialogTitle>
            </DialogHeader>
            <ProjectForm initial={editing ?? undefined} onSaved={onSaved} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
