"use client";

import * as React from "react";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import { useAuth } from "@/components/providers/AuthProvider";
import { fetchProjects, type Project } from "@/services/api/projects.service";

export default function MyWorkPageClient() {
  const { user } = useAuth();

  const [projects, setProjects] = React.useState<Project[]>([]);
  React.useEffect(() => {
    let mounted = true;
    fetchProjects()
      .then((ps) => {
        if (!mounted) return;
        setProjects(ps);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      <h1 className="text-2xl font-bold tracking-tight">Mi trabajo</h1>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Mis proyectos</h2>
        {projects.length ? (
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <li key={p.id} className="rounded border p-3">
                <div className="text-sm font-medium">
                  {p.name} <span className="text-muted-foreground">({p.key})</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {p.dueDate
                    ? <>Entrega {new Date(p.dueDate).toLocaleDateString()}</>
                    : <>Sin fecha de entrega</>}
                </div>
                <a href={`/projects/${p.id}/kanban`} className="mt-2 inline-block text-xs underline">
                  Ver
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-sm text-muted-foreground">Aún no tienes proyectos.</div>
        )}
      </div>

    </div>
  );
}
