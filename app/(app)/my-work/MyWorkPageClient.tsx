"use client";

import * as React from "react";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import { useAuth } from "@/components/providers/AuthProvider";
import { fetchProjects, type Project } from "@/services/api/projects.service";
import { fetchTasks, type Task } from "@/services/api/tasks.service";
import { fetchSprints, type Sprint } from "@/services/api/sprints.service";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function MyWorkPageClient() {
  const { user } = useAuth();

  const [projects, setProjects] = React.useState<Project[]>([]);
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [sprints, setSprints] = React.useState<Sprint[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const ps = await fetchProjects(); // owner-scoped (mis proyectos)
      setProjects(ps);

      // Mis tareas (asignadas a mí)
      let ts: Task[] = [];
      if (user?.id) {
        try {
          ts = await fetchTasks({ assigneeId: user.id });
        } catch {
          ts = [];
        }
      }
      setTasks(ts);

      // Sprints de mis proyectos (filtrar por projectId propio)
      let ss: Sprint[] = [];
      try {
        ss = await fetchSprints();
      } catch {
        ss = [];
      }
      const myProjectIds = new Set(ps.map((p) => p.id));
      setSprints(ss.filter((s) => myProjectIds.has(s.projectId)));
    } catch {
      setProjects([]);
      setTasks([]);
      setSprints([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  React.useEffect(() => {
    load();
  }, [load]);

  const projectById = React.useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);

  // Ordenar tareas: por dueDate asc, luego título
  const sortedTasks = React.useMemo(() => {
    return [...tasks].sort((a, b) => {
      const da = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      const db = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      if (da !== db) return da - db;
      return a.title.localeCompare(b.title);
    });
  }, [tasks]);

  // Sprints activos o próximos: ordenar por startDate asc
  const sortedSprints = React.useMemo(() => {
    return [...sprints].sort((a, b) => {
      const sa = a.startDate ? new Date(a.startDate).getTime() : Number.MAX_SAFE_INTEGER;
      const sb = b.startDate ? new Date(b.startDate).getTime() : Number.MAX_SAFE_INTEGER;
      return sa - sb;
    });
  }, [sprints]);

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Mi trabajo</h1>
        <Button size="sm" variant="outline" onClick={() => load()}>
          Refrescar
        </Button>
      </div>

      {/* Mis proyectos */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Mis proyectos</h2>
        {loading ? (
          <div className="text-sm text-muted-foreground">Cargando…</div>
        ) : projects.length ? (
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <li key={p.id} className="rounded border p-3">
                <div className="text-sm font-medium">
                  {p.name} <span className="text-muted-foreground">({p.key})</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {p.dueDate ? <>Entrega {new Date(p.dueDate).toLocaleDateString()}</> : <>Sin fecha de entrega</>}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Link href={`/projects/${p.id}/kanban`} className="text-xs underline">
                    Kanban
                  </Link>
                  <span className="text-xs text-muted-foreground">·</span>
                  <Link href={`/projects/${p.id}/list`} className="text-xs underline">
                    Lista
                  </Link>
                  <span className="text-xs text-muted-foreground">·</span>
                  <Link href={`/projects/${p.id}/sprints`} className="text-xs underline">
                    Sprints
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-sm text-muted-foreground">Aún no tienes proyectos.</div>
        )}
      </div>

      {/* Mis tareas asignadas */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Mis tareas asignadas</h2>
        {loading ? (
          <div className="text-sm text-muted-foreground">Cargando…</div>
        ) : sortedTasks.length ? (
          <ul className="divide-y rounded border">
            {sortedTasks.slice(0, 10).map((t) => {
              const p = projectById.get(t.projectId);
              return (
                <li key={t.id} className="flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {t.title}
                      {p ? <span className="text-muted-foreground">{` · ${p.name} (${p.key})`}</span> : null}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t.dueDate ? `Vence ${new Date(t.dueDate).toLocaleDateString()}` : "Sin fecha"} · {t.priority} · {t.status}
                    </div>
                  </div>
                  <Link href={`/projects/${t.projectId}/list`} className="text-xs underline">
                    Abrir
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="text-sm text-muted-foreground">No tienes tareas asignadas.</div>
        )}
      </div>

      {/* Sprints de mis proyectos */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Sprints de mis proyectos</h2>
        {loading ? (
          <div className="text-sm text-muted-foreground">Cargando…</div>
        ) : sortedSprints.length ? (
          <ul className="divide-y rounded border">
            {sortedSprints.slice(0, 10).map((s) => {
              const p = projectById.get(s.projectId);
              return (
                <li key={s.id} className="flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {s.name}
                      {p ? <span className="text-muted-foreground">{` · ${p.name} (${p.key})`}</span> : null}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(s.startDate).toLocaleDateString()} – {new Date(s.endDate).toLocaleDateString()}
                      {s.completed ? " · Finalizado" : ""}
                    </div>
                  </div>
                  <Link href={`/projects/${s.projectId}/sprints`} className="text-xs underline">
                    Abrir
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="text-sm text-muted-foreground">No hay sprints relacionados a tus proyectos.</div>
        )}
      </div>
    </div>
  );
}
