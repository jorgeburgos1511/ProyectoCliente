"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import { getProjectById } from "@/services/mock/projects.service";
import { cn } from "@/lib/utils";

const tabs = [
  { href: (id: string) => `/projects/${id}/kanban`, label: "Kanban" },
  { href: (id: string) => `/projects/${id}/list`, label: "Lista" },
  { href: (id: string) => `/projects/${id}/sprints`, label: "Sprints" },
  { href: (id: string) => `/projects/${id}/tags`, label: "Etiquetas" },
  { href: (id: string) => `/projects/${id}/files`, label: "Archivos" },
];

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ id: string }>();
  const pathname = usePathname();
  const id = params?.id as string;
  const project = getProjectById(id);

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {project?.name ?? "Proyecto"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Clave: {project?.key ?? "-"}
            </p>
          </div>
          <div className="text-xs text-muted-foreground">ID: {id}</div>
        </div>

        <div className="flex items-center gap-2 border-b">
          {tabs.map((t) => {
            const href = t.href(id);
            const active = pathname?.startsWith(href);
            return (
              <Link
                key={t.label}
                href={href}
                className={cn(
                  "inline-flex items-center border-b-2 px-3 py-2 text-sm",
                  active
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {t.label}
              </Link>
            );
          })}
        </div>
      </div>

      {children}
    </div>
  );
}
