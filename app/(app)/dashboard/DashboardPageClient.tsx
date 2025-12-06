"use client";

import * as React from "react";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { fetchProjects, type Project } from "@/services/api/projects.service";
import { fetchGoals, type Goal } from "@/services/api/goals.service";
import { fetchTasks, type Task } from "@/services/api/tasks.service";
import { fetchSprints, type Sprint } from "@/services/api/sprints.service";

function SectionCard({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}

export default function DashboardPageClient() {
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [goals, setGoals] = React.useState<Goal[]>([]);
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [sprints, setSprints] = React.useState<Sprint[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      const [ps, gs, ts, ss] = await Promise.all([
        fetchProjects(),
        fetchGoals(),
        fetchTasks(),
        fetchSprints(),
      ]);
      setProjects(ps);
      setGoals(gs);
      setTasks(ts);
      setSprints(ss);
    } catch {
      setProjects([]);
      setGoals([]);
      setTasks([]);
      setSprints([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const in7 = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);

  const projectById = React.useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);

  const upcomingProjects = React.useMemo(() => {
    return projects
      .filter((p) => !!p.dueDate)
      .filter((p) => {
        const d = new Date(p.dueDate as string);
        return d >= startOfToday && d <= in7;
      })
      .sort((a, b) => new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime())
      .slice(0, 5);
  }, [projects, startOfToday, in7]);

  const upcomingGoals = React.useMemo(() => {
    return goals
      .filter((g) => !!g.dueDate)
      .filter((g) => {
        const d = new Date(g.dueDate as string);
        return d >= startOfToday && d <= in7;
      })
      .sort((a, b) => new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime())
      .slice(0, 5);
  }, [goals, startOfToday, in7]);

  const upcomingTasks = React.useMemo(() => {
    return tasks
      .filter((t) => !!t.dueDate)
      .filter((t) => {
        const d = new Date(t.dueDate as string);
        return d >= startOfToday && d <= in7;
      })
      .sort((a, b) => new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime())
      .slice(0, 5);
  }, [tasks, startOfToday, in7]);

  const activeSprints = React.useMemo(() => {
    return sprints
      .filter((s) => !!s.startDate && !!s.endDate)
      .filter((s) => {
        const start = new Date(s.startDate as string);
        const end = new Date(s.endDate as string);
        return start <= today && today <= end;
      })
      .sort((a, b) => new Date(a.endDate || 0).getTime() - new Date(b.endDate || 0).getTime())
      .slice(0, 5);
  }, [sprints, today]);

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>

      {/* Accesos directos */}
      <SectionCard
        title="Accesos"
        action={
          <Button size="sm" variant="outline" onClick={() => load()}>
            Refrescar
          </Button>
        }
      >
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/projects">Proyectos</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/goals">Metas</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/calendar">Calendario</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/my-work">Mi trabajo</Link>
          </Button>
        </div>
      </SectionCard>

      {/* Estadísticas simples */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <StatCard label="Proyectos" value={loading ? "-" : projects.length} />
        <StatCard label="Metas" value={loading ? "-" : goals.length} />
        <StatCard label="Tareas" value={loading ? "-" : tasks.length} />
        <StatCard label="Sprints" value={loading ? "-" : sprints.length} />
        <StatCard
          label="Próx. entregas (7 días)"
          value={loading ? "-" : upcomingProjects.length + upcomingGoals.length + upcomingTasks.length}
        />
        <StatCard label="Sprints activos" value={loading ? "-" : activeSprints.length} />
      </div>

      {/* Próximas entregas */}
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="Próximas entregas de proyectos (7 días)"
          action={
            <Button asChild size="sm" variant="outline">
              <Link href="/projects">Ver todos</Link>
            </Button>
          }
        >
          {loading ? (
            <div className="py-6 text-sm text-muted-foreground">Cargando…</div>
          ) : upcomingProjects.length ? (
            <ul className="divide-y">
              {upcomingProjects.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {p.name} <span className="text-muted-foreground">({p.key})</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Entrega: {p.dueDate ? new Date(p.dueDate).toLocaleDateString() : "-"}
                    </div>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/projects/${p.id}/kanban`}>Abrir</Link>
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-6 text-sm text-muted-foreground">No hay entregas próximas.</div>
          )}
        </SectionCard>

        <SectionCard
          title="Próximas entregas de metas (7 días)"
          action={
            <Button asChild size="sm" variant="outline">
              <Link href="/goals">Ver todas</Link>
            </Button>
          }
        >
          {loading ? (
            <div className="py-6 text-sm text-muted-foreground">Cargando…</div>
          ) : upcomingGoals.length ? (
            <ul className="divide-y">
              {upcomingGoals.map((g) => (
                <li key={g.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{g.title}</div>
                    <div className="text-xs text-muted-foreground">
                      Entrega: {g.dueDate ? new Date(g.dueDate).toLocaleDateString() : "-"}
                    </div>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/goals">Abrir</Link>
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-6 text-sm text-muted-foreground">No hay entregas próximas.</div>
          )}
        </SectionCard>
      </div>

      {/* Tareas y Sprints */}
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="Tareas próximas (7 días)"
          action={
            <Button asChild size="sm" variant="outline">
              <Link href="/my-work">Ver todas</Link>
            </Button>
          }
        >
          {loading ? (
            <div className="py-6 text-sm text-muted-foreground">Cargando…</div>
          ) : upcomingTasks.length ? (
            <ul className="divide-y">
              {upcomingTasks.map((t) => {
                const p = projectById.get(t.projectId);
                return (
                  <li key={t.id} className="flex items-center justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {t.title}
                        {p ? <span className="text-muted-foreground">{` · ${p.name} (${p.key})`}</span> : null}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Vence: {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "-"} · {t.priority}
                      </div>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/projects/${t.projectId}/list`}>Abrir</Link>
                    </Button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="py-6 text-sm text-muted-foreground">No hay tareas próximas.</div>
          )}
        </SectionCard>

        <SectionCard
          title="Sprints activos"
          action={
            <Button asChild size="sm" variant="outline">
              <Link href="/projects">Ver proyectos</Link>
            </Button>
          }
        >
          {loading ? (
            <div className="py-6 text-sm text-muted-foreground">Cargando…</div>
          ) : activeSprints.length ? (
            <ul className="divide-y">
              {activeSprints.map((s) => {
                const p = projectById.get(s.projectId);
                return (
                  <li key={s.id} className="flex items-center justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {s.name}
                        {p ? <span className="text-muted-foreground">{` · ${p.name} (${p.key})`}</span> : null}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(s.startDate).toLocaleDateString()} – {new Date(s.endDate).toLocaleDateString()}
                      </div>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/projects/${s.projectId}/sprints`}>Abrir</Link>
                    </Button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="py-6 text-sm text-muted-foreground">No hay sprints activos.</div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
