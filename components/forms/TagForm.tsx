"use client";

import * as React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Nombre de etiqueta requerido" })
    .max(24, { message: "Máximo 24 caracteres" })
    .regex(/^[a-z0-9-]+$/i, { message: "Solo letras, números y guiones" }),
});

type FormInput = z.input<typeof schema>;

export default function TagForm({
  initial,
  onSaved,
}: {
  initial?: { name: string } | null;
  onSaved?: (tag: { name: string }) => void;
}) {
  const form = useForm<FormInput>({
    resolver: zodResolver(schema),
    defaultValues: initial ? { name: initial.name } : { name: "" },
  });

  const [saving, setSaving] = React.useState(false);

  const onSubmit = async (values: FormInput) => {
    setSaving(true);
    try {
      if (initial) {
        toast.info("Actualizado", "Etiqueta actualizada");
      } else {
        toast.success("Se creó correctamente");
      }
      onSaved?.({ name: values.name });
    } catch {
      toast.destructive("Error", "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div>
        <label className="mb-1 block text-sm font-medium">Nombre</label>
        <input
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="bug"
          {...form.register("name")}
        />
        {form.formState.errors.name && (
          <p className="mt-1 text-xs text-red-600">{form.formState.errors.name.message}</p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          Sugerencia: usa minúsculas y guiones (ej. bug, high-priority)
        </p>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? "Guardando..." : initial ? "Actualizar" : "Crear"}
        </Button>
      </div>
    </form>
  );
}
