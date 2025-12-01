"use client";

import * as React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { Project } from "@/services/api/projects.service";
import { createProject, updateProject } from "@/services/api/projects.service";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";

const schema = z.object({
  name: z.string().trim().min(1, { message: "Nombre requerido" }),
  key: z
    .string()
    .trim()
    .min(2, { message: "Min 2 caracteres" })
    .max(6, { message: "Max 6 caracteres" })
    .regex(/^[A-Z0-9]+$/, { message: "Solo mayúsculas y números" }),
  dueDate: z.string().optional(),
});

type FormInput = z.input<typeof schema>;

export default function ProjectForm({
  onSaved,
  initial,
}: {
  onSaved?: (project: Project) => void;
  initial?: Project | null;
}) {
  const form = useForm<FormInput>({
    resolver: zodResolver(schema),
    defaultValues: initial
      ? {
          name: initial.name,
          key: initial.key,
          dueDate: initial.dueDate ? initial.dueDate.slice(0, 10) : "",
        }
      : {
          name: "",
          key: "",
          dueDate: "",
        },
  });

  const [saving, setSaving] = React.useState(false);


  const onSubmit = async (values: FormInput) => {
    setSaving(true);
    try {
      const payload = {
        ...values,
        dueDate: values.dueDate && values.dueDate.length ? values.dueDate : undefined,
      };
      const projectInput = payload as any;

      let saved: Project | undefined;
      if (initial) {
        saved = await updateProject(initial.id, projectInput);
        toast.info("Actualizado", "Proyecto actualizado correctamente");
      } else {
        saved = await createProject(projectInput as Omit<Project, "id" | "ownerId">);
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
            placeholder="TaskFlow"
            {...form.register("name")}
          />
          {form.formState.errors.name && (
            <p className="mt-1 text-xs text-red-600">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Clave</label>
          <input
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm uppercase"
            placeholder="TF"
            {...form.register("key")}
            onChange={(e) => {
              e.target.value = e.target.value.toUpperCase();
              form.setValue("key", e.target.value.toUpperCase(), {
                shouldValidate: true,
                shouldDirty: true,
              });
            }}
          />
          {form.formState.errors.key && (
            <p className="mt-1 text-xs text-red-600">
              {form.formState.errors.key.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-3">
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
      </div>


      <div className="flex items-center justify-end gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? "Guardando..." : initial ? "Actualizar" : "Crear"}
        </Button>
      </div>
    </form>
  );
}
