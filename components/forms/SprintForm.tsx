"use client";

import * as React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { Sprint } from "@/services/api/sprints.service";
import { createSprint, updateSprint } from "@/services/api/sprints.service";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";

const schema = z
  .object({
    name: z.string().trim().min(1, { message: "Nombre requerido" }),
    startDate: z.string().min(1, { message: "Fecha de inicio requerida" }),
    endDate: z.string().min(1, { message: "Fecha de fin requerida" }),
    goal: z.string().optional(),
    projectId: z.string().min(1),
  })
  .refine(
    (v) => {
      const s = new Date(v.startDate);
      const e = new Date(v.endDate);
      return !isNaN(s.getTime()) && !isNaN(e.getTime()) && s.getTime() <= e.getTime();
    },
    {
      message: "El rango de fechas es inválido",
      path: ["endDate"],
    }
  );

type FormInput = z.input<typeof schema>;

export default function SprintForm({
  projectId,
  initial,
  onSaved,
}: {
  projectId: string;
  initial?: Sprint | null;
  onSaved?: (sprint: Sprint) => void;
}) {
  const form = useForm<FormInput>({
    resolver: zodResolver(schema),
    defaultValues: initial
      ? {
          name: initial.name,
          startDate: initial.startDate,
          endDate: initial.endDate,
          goal: initial.goal ?? "",
          projectId: initial.projectId,
        }
      : {
          name: "",
          startDate: "",
          endDate: "",
          goal: "",
          projectId,
        },
  });

  const [saving, setSaving] = React.useState(false);

  const onSubmit = async (values: FormInput) => {
    setSaving(true);
    try {
      let saved: Sprint | undefined;
      if (initial) {
        saved = await updateSprint(initial.id, values);
        toast.info("Actualizado", "Sprint actualizado correctamente");
      } else {
        saved = await createSprint(values as Omit<Sprint, "id">);
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
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Nombre</label>
          <input
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Sprint 1"
            {...form.register("name")}
          />
          {form.formState.errors.name && (
            <p className="mt-1 text-xs text-red-600">{form.formState.errors.name.message}</p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Objetivo (opcional)</label>
          <input
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Objetivo del sprint"
            {...form.register("goal")}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Inicio</label>
          <input
            type="date"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            {...form.register("startDate")}
          />
          {form.formState.errors.startDate && (
            <p className="mt-1 text-xs text-red-600">{form.formState.errors.startDate.message}</p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Fin</label>
          <input
            type="date"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            {...form.register("endDate")}
          />
          {form.formState.errors.endDate && (
            <p className="mt-1 text-xs text-red-600">{form.formState.errors.endDate.message}</p>
          )}
        </div>
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
