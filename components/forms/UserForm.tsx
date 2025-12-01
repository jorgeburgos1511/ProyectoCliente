"use client";

import * as React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { User, Role } from "@/lib/roles";
import { toast } from "@/lib/toast";

const schema = z.object({
  name: z.string().trim().min(1, { message: "Nombre requerido" }),
  email: z.string().trim().email({ message: "Correo inválido" }),
  role: z.enum(["admin", "manager", "developer"]),
});

type FormInput = z.input<typeof schema>;

export default function UserForm({
  initial,
  onSaved,
}: {
  initial?: User | null;
  onSaved?: (user: User) => void;
}) {
  const form = useForm<FormInput>({
    resolver: zodResolver(schema),
    defaultValues: initial
      ? { name: initial.name, email: initial.email, role: initial.role }
      : { name: "", email: "", role: "developer" },
  });

  const [saving, setSaving] = React.useState(false);

  const onSubmit = async (values: FormInput) => {
    setSaving(true);
    try {
      const saved: User = initial
        ? { ...initial, ...values }
        : {
            id: `u${Math.floor(Math.random() * 10000)}`,
            ...values,
          };
      if (initial) toast.info("Actualizado", "Usuario actualizado correctamente");
      else toast.success("Se creó correctamente");
      onSaved?.(saved);
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
            placeholder="Ana Demo"
            {...form.register("name")}
          />
          {form.formState.errors.name && (
            <p className="mt-1 text-xs text-red-600">{form.formState.errors.name.message}</p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Correo</label>
          <input
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            type="email"
            placeholder="ana@demo.io"
            {...form.register("email")}
          />
          {form.formState.errors.email && (
            <p className="mt-1 text-xs text-red-600">{form.formState.errors.email.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Rol</label>
        <select
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          {...form.register("role")}
        >
          <option value="admin">admin</option>
          <option value="manager">manager</option>
          <option value="developer">developer</option>
        </select>
        {form.formState.errors.role && (
          <p className="mt-1 text-xs text-red-600">{form.formState.errors.role.message}</p>
        )}
      </div>

      <div className="flex items-center justify-end gap-2">
        <button
          type="submit"
          className="rounded border px-3 py-2 text-sm"
          disabled={saving}
        >
          {saving ? "Guardando..." : initial ? "Actualizar" : "Crear"}
        </button>
      </div>
      <p className="text-xs text-muted-foreground">
        Nota: Este formulario es solo mock; no se guarda en ningún backend.
      </p>
    </form>
  );
}
