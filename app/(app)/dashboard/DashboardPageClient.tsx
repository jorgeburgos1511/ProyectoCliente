"use client";

import * as React from "react";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { fetchProjects, type Project } from "@/services/api/projects.service";
import { fetchGoals, type Goal } from "@/services/api/goals.service";

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
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      const [ps, gs] = await Promise.all([fetchProjects(), fetchGoals()]);
      setProjects(ps);
      setGoals(gs);
    } catch {
      setProjects([]);
      setGoals([]);
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

  const upcomingProjects = React.useMemo(() => {
    return projects
      .filter((p) => !!p.dueDate)
      .filter((p) => {
        const d = new Date(p.dueDate as string);
        return d >= startOfToday && d <= in7;
      })
      .sort(
        (a, b) =>
          new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime()
      )
      .slice(0, 5);
  }, [projects, startOfToday, in7]);

  const upcomingGoals = React.useMemo(() => {
    return goals
      .filter((g) => !!g.dueDate)
      .filter((g) => {
        const d = new Date(g.dueDate as string);
        return d >= startOfToday && d <= in7;
      })
      .sort(
        (a, b) =>
          new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime()
      )
      .slice(0, 5);
  }, [goals, startOfToday, in7]);

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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Proyectos" value={loading ? "-" : projects.length} />
        <StatCard label="Metas" value={loading ? "-" : goals.length} />
        <StatCard
          label="Próx. entregas (7 días)"
          value={
            loading ? "-" : upcomingProjects.length + upcomingGoals.length
          }
        />
        <StatCard
          label="Sin fecha (Proy.)"
          value={loading ? "-" : projects.filter((p) => !p.dueDate).length}
        />
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
              {upcomingProjects.map((p: Project) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {p.name}{" "}
                      <span className="text-muted-foreground">({p.key})</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Entrega:{" "}
                      {p.dueDate
                        ? new Date(p.dueDate).toLocaleDateString()
                        : "-"}
                    </div>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/projects/${p.id}/kanban`}>Abrir</Link>
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-6 text-sm text-muted-foreground">
              No hay entregas próximas.
            </div>
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
              {upcomingGoals.map((g: Goal) => (
                <li
                  key={g.id}
                  className="flex items-center justify-between gap-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {g.title}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Entrega:{" "}
                      {g.dueDate
                        ? new Date(g.dueDate).toLocaleDateString()
                        : "-"}
                    </div>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/goals">Abrir</Link>
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-6 text-sm text-muted-foreground">
              No hay entregas próximas.
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
