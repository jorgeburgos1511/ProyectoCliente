"use client";

import * as React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { Task } from "@/services/api/tasks.service";
import {
  createTask,
  updateTask,
  listStatuses,
  listPriorities,
} from "@/services/api/tasks.service";
import { fetchUsers, type SimpleUser } from "@/services/api/users-public.service";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";

const schema = z.object({
  title: z.string().trim().min(1, { message: "Título requerido" }),
  status: z.enum(["Todo", "Doing", "Done"]),
  priority: z.enum(["High", "Medium", "Low"]),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
  points: z.coerce.number().int().min(0).max(100).optional(),
  projectId: z.string().min(1),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

type FormValues = z.input<typeof schema>;

export default function TaskForm({
  projectId,
  initial,
  onSaved,
}: {
  projectId: string;
  initial?: Task | null;
  onSaved?: (task: Task) => void;
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initial
      ? {
          title: initial.title,
          status: initial.status,
          priority: initial.priority,
          assigneeId: initial.assigneeId ?? "",
          dueDate: initial.dueDate ?? "",
          points: initial.points ?? undefined,
          projectId: initial.projectId,
          description: initial.description ?? "",
          tags: initial.tags ?? [],
        }
      : {
          title: "",
          status: listStatuses()[0],
          priority: listPriorities()[0],
          assigneeId: "",
          dueDate: "",
          points: undefined,
          projectId,
          description: "",
          tags: [],
        },
  });

  const [users, setUsers] = React.useState<SimpleUser[]>([]);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    fetchUsers()
      .then((us) => {
        if (!mounted) return;
        setUsers(us);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      const payload = {
        ...values,
        points:
          values.points === undefined || values.points === null
            ? undefined
            : Number(values.points),
      };
      let saved: Task | undefined;
      if (initial) {
        saved = await updateTask(initial.id, payload);
        toast.info("Actualizado", "Tarea actualizada correctamente");
      } else {
        saved = await createTask(payload as Omit<Task, "id">);
        toast.success("Se creó correctamente");
      }
      if (saved) onSaved?.(saved);
    } catch {
      toast.destructive("Error", "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div>
        <label className="mb-1 block text-sm font-medium">Título</label>
        <input
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Implementar Login"
          {...form.register("title")}
        />
        {form.formState.errors.title && (
          <p className="mt-1 text-xs text-red-600">{form.formState.errors.title.message}</p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Estado</label>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            {...form.register("status")}
          >
            {listStatuses().map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {form.formState.errors.status && (
            <p className="mt-1 text-xs text-red-600">{form.formState.errors.status.message}</p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Prioridad</label>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            {...form.register("priority")}
          >
            {listPriorities().map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          {form.formState.errors.priority && (
            <p className="mt-1 text-xs text-red-600">{form.formState.errors.priority.message}</p>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium">Asignado a</label>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            {...form.register("assigneeId")}
          >
            <option value="">Sin asignar</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.email})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Vence</label>
          <input
            type="date"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            {...form.register("dueDate")}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Puntos</label>
          <input
            type="number"
            min={0}
            max={100}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            {...form.register("points")}
          />
          {form.formState.errors.points && (
            <p className="mt-1 text-xs text-red-600">{form.formState.errors.points.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Descripción</label>
        <textarea
          rows={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Notas o descripción..."
          {...form.register("description")}
        />
      </div>

      <input type="hidden" {...form.register("projectId")} />

      <div className="flex items-center justify-end gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? "Guardando..." : initial ? "Actualizar" : "Crear"}
        </Button>
      </div>
    </form>
  );
}
