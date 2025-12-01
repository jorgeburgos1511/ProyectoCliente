"use client";

import * as React from "react";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import UsersTable from "@/components/tables/UsersTable";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import UserForm from "@/components/forms/UserForm";
import type { User } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";

export default function AdminUsersPageClient() {
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<User | null>(null);

  const onCreate = () => {
    setEditing(null);
    setOpen(true);
  };

  const onEdit = (user: User) => {
    setEditing(user);
    setOpen(true);
  };

  const onSaved = (u: User) => {
    toast.success(editing ? "Actualizado" : "Se creó correctamente");
    setOpen(false);
    setEditing(null);
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-bold tracking-tight">Administración / Usuarios</h1>
        <Button onClick={onCreate}>Crear usuario</Button>
      </div>

      <UsersTable onCreate={onCreate} onEdit={onEdit} />

      <Dialog open={open} onOpenChange={(o) => (!o ? setOpen(false) : setOpen(true))}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar usuario" : "Crear usuario"}</DialogTitle>
          </DialogHeader>
          <UserForm initial={editing ?? undefined} onSaved={onSaved} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
