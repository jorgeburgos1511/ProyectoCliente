"use client";

import * as React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { Goal } from "@/services/api/goals.service";
import { createGoal, updateGoal } from "@/services/api/goals.service";
import { fetchProjects, type Project } from "@/services/api/projects.service";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";

const schema = z.object({
  title: z.string().trim().min(1, { message: "Título requerido" }),
  progress: z.coerce.number().int().min(0, { message: "Mínimo 0" }).max(100, { message: "Máximo 100" }),
  projectId: z.string().optional(),
  dueDate: z.string().optional(),
});

type FormInput = z.input<typeof schema>;

export default function GoalForm({
  initial,
  onSaved,
}: {
  initial?: Goal | null;
  onSaved?: (goal: Goal) => void;
}) {
  const [projects, setProjects] = React.useState<Project[]>([]);

  const form = useForm<FormInput>({
    resolver: zodResolver(schema),
    defaultValues: initial
      ? {
          title: initial.title,
          progress: initial.progress,
          projectId: initial.projectId,
          dueDate: initial.dueDate ? initial.dueDate.slice(0, 10) : "",
        }
      : { title: "", progress: 0, projectId: "", dueDate: "" },
  });

  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    fetchProjects()
      .then((ps) => {
        if (!mounted) return;
        setProjects(ps);
        if (!initial && ps.length > 0) {
          form.setValue("projectId", ps[0].id, { shouldDirty: true });
        }
      })
      .catch(() => {

      });
    return () => {
      mounted = false;
    };
  }, [initial, form]);

  const onSubmit = async (values: FormInput) => {
    setSaving(true);
    try {
      const payload = {
        ...values,
        progress:
          values.progress === undefined || values.progress === null
            ? 0
            : Number(values.progress),
        dueDate: values.dueDate && values.dueDate.length ? values.dueDate : undefined,
      };
      let saved: Goal | undefined;
      if (initial) {
        saved = await updateGoal(initial.id, payload);
        toast.info("Actualizado", "Objetivo actualizado correctamente");
      } else {
        saved = await createGoal(payload as Omit<Goal, "id">);
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
          placeholder="Mejorar throughput"
          {...form.register("title")}
        />
        {form.formState.errors.title && (
          <p className="mt-1 text-xs text-red-600">{form.formState.errors.title.message}</p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Progreso (%)</label>
          <input
            type="number"
            min={0}
            max={100}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            {...form.register("progress")}
          />
          {form.formState.errors.progress && (
            <p className="mt-1 text-xs text-red-600">{form.formState.errors.progress.message}</p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Proyecto (opcional)</label>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            {...form.register("projectId")}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.key})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Fecha de entrega</label>
        <input
          type="date"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          {...form.register("dueDate")}
        />
        {form.formState.errors.dueDate && (
          <p className="mt-1 text-xs text-red-600">
            {form.formState.errors.dueDate.message}
          </p>
        )}
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? "Guardando..." : initial ? "Actualizar" : "Crear"}
        </Button>
      </div>
    </form>
  );
}
