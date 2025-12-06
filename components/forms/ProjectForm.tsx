"use client";

import * as React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { Project } from "@/services/api/projects.service";
import { createProject, updateProject } from "@/services/api/projects.service";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { fetchUsers, type SimpleUser } from "@/services/api/users-public.service";
import { useAuth } from "@/components/providers/AuthProvider";
import { isAdmin, isManager } from "@/lib/roles";

const schema = z.object({
  name: z.string().trim().min(1, { message: "Nombre requerido" }),
  key: z
    .string()
    .trim()
    .min(2, { message: "Min 2 caracteres" })
    .max(6, { message: "Max 6 caracteres" })
    .regex(/^[A-Z0-9]+$/, { message: "Solo mayúsculas y números" }),
  dueDate: z.string().optional(),
  members: z.array(z.string()).optional(),
});

type FormInput = z.input<typeof schema>;

export default function ProjectForm({
  onSaved,
  initial,
}: {
  onSaved?: (project: Project) => void;
  initial?: Project | null;
}) {
  // Permitir usar ProjectForm en tests sin envolver con AuthProvider:
  // si no hay contexto, user será null (solo afecta UI no-crítica)
  let authCtx: ReturnType<typeof useAuth> | null = null;
  try {
    authCtx = useAuth();
  } catch {
    authCtx = null;
  }
  const user = authCtx?.user ?? null;
  const canAssign = isAdmin(user) || isManager(user);
  const [assignable, setAssignable] = React.useState<SimpleUser[]>([]);
  const [q, setQ] = React.useState("");
  const [domain, setDomain] = React.useState("");
  const [onlyDev, setOnlyDev] = React.useState(true);

  const form = useForm<FormInput>({
    resolver: zodResolver(schema),
    defaultValues: initial
      ? {
          name: initial.name,
          key: initial.key,
          dueDate: initial.dueDate ? initial.dueDate.slice(0, 10) : "",
          members: initial.members ?? [],
        }
      : {
          name: "",
          key: "",
          dueDate: "",
          members: [],
        },
  });

  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    if (canAssign) {
      fetchUsers()
        .then((us) => {
          if (!mounted) return;
          setAssignable(us);
        })
        .catch(() => {
          if (!mounted) return;
          setAssignable([]);
        });
    } else {
      setAssignable([]);
    }
    return () => {
      mounted = false;
    };
  }, [canAssign]);


  const onSubmit = async (values: FormInput) => {
    setSaving(true);
    try {
      // Validación: si manager/admin puede asignar, exigir elegir miembros (al menos uno)
      if (!initial && canAssign) {
        const picked = (values.members ?? []).filter(Boolean);
        if (picked.length === 0) {
          toast.destructive("Selecciona al menos un miembro del dominio");
          setSaving(false);
          return;
        }
      }

      const payload = {
        ...values,
        members: (values.members ?? []).filter(Boolean),
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

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Propietario</label>
          <input
            className="w-full rounded-md border border-input bg-muted px-3 py-2 text-sm"
            value={`${user?.name ?? ""}${user?.email ? ` (${user.email})` : ""}`}
            readOnly
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Se asignará automáticamente al crear el proyecto.
          </p>
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

        {canAssign ? (
          <div className="space-y-2">
            <label className="mb-1 block text-sm font-medium">
              Miembros del proyecto
            </label>

            {/* Controles de ayuda (búsqueda local y filtros para admin) */}
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por nombre o correo..."
                className="h-9 w-64 rounded-md border border-input bg-background px-3 text-sm"
              />
              {isAdmin(user) && (
                <>
                  <input
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="Filtrar dominio (ej. empresa.com)"
                    className="h-9 w-60 rounded-md border border-input bg-background px-3 text-sm"
                  />
                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={onlyDev}
                      onChange={(e) => setOnlyDev(e.target.checked)}
                    />
                    Solo developers
                  </label>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const list = await fetchUsers({
                          role: onlyDev ? "developer" : undefined,
                          domain: domain || undefined,
                        });
                        setAssignable(list);
                      } catch {
                        setAssignable([]);
                      }
                    }}
                    className="h-9 rounded-md border px-3 text-sm"
                  >
                    Aplicar filtros
                  </button>
                </>
              )}
            </div>

            {/* Acciones rápidas */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <button
                type="button"
                className="rounded border px-2 py-1"
                onClick={() => {
                  const filtered = assignable.filter((u) => {
                    const term = q.trim().toLowerCase();
                    const matches =
                      !term ||
                      u.name.toLowerCase().includes(term) ||
                      u.email.toLowerCase().includes(term);
                    return matches;
                  });
                  form.setValue(
                    "members",
                    filtered.map((u) => u.id),
                    { shouldDirty: true, shouldValidate: true }
                  );
                }}
              >
                Seleccionar todos (filtrados)
              </button>
              <button
                type="button"
                className="rounded border px-2 py-1"
                onClick={() =>
                  form.setValue("members", [], {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              >
                Limpiar selección
              </button>
              <span>
                Seleccionados: {(form.watch("members") as string[] | undefined)?.length ?? 0}
              </span>
            </div>

            {/* Lista de checkboxes (sin Ctrl/Cmd) */}
            <div className="max-h-56 overflow-auto rounded-md border">
              <ul className="divide-y">
                {assignable
                  .filter((u) => {
                    const term = q.trim().toLowerCase();
                    return (
                      !term ||
                      u.name.toLowerCase().includes(term) ||
                      u.email.toLowerCase().includes(term)
                    );
                  })
                  .map((u) => (
                    <li key={u.id} className="flex items-center gap-2 p-2">
                      <input
                        type="checkbox"
                        value={u.id}
                        {...form.register("members")}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">
                        {u.name} <span className="text-muted-foreground">({u.email})</span>
                      </span>
                    </li>
                  ))}
                {assignable.length === 0 && (
                  <li className="p-3 text-sm text-muted-foreground">No hay usuarios disponibles.</li>
                )}
              </ul>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Los miembros elegidos también serán asignados al sprint cuando lo crees (herencia desde proyecto).
            </p>
          </div>
        ) : null}
      </div>


      <div className="flex items-center justify-end gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? "Guardando..." : initial ? "Actualizar" : "Crear"}
        </Button>
      </div>
    </form>
  );
}
