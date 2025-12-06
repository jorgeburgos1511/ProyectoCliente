"use client";

import * as React from "react";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import CalendarToolbar from "@/components/calendar/CalendarToolbar";
import CalendarView from "@/components/calendar/CalendarView";
import { fetchProjects } from "@/services/api/projects.service";
import { fetchGoals } from "@/services/api/goals.service";
import { fetchTasks } from "@/services/api/tasks.service";
import { fetchSprints } from "@/services/api/sprints.service";
import type { CalendarEvent } from "@/components/calendar/CalendarView";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/AuthProvider";
import { isAdmin, isManager } from "@/lib/roles";
import { fetchUsers, type SimpleUser } from "@/services/api/users-public.service";

type View = "month" | "week";

export default function CalendarPage() {
  const { user } = useAuth();
  const [view, setView] = React.useState<View>("month");
  const [events, setEvents] = React.useState<CalendarEvent[]>([]);
  const [current, setCurrent] = React.useState<Date>(new Date());
  const [assigneeMap, setAssigneeMap] = React.useState<Record<string, string>>({});

  const onToday = React.useCallback(() => {
    setCurrent(new Date());
  }, []);

  const onPrev = React.useCallback(() => {
    setCurrent((d) =>
      view === "week"
        ? new Date(d.getFullYear(), d.getMonth(), d.getDate() - 7)
        : new Date(d.getFullYear(), d.getMonth() - 1, 1)
    );
  }, [view]);

  const onNext = React.useCallback(() => {
    setCurrent((d) =>
      view === "week"
        ? new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7)
        : new Date(d.getFullYear(), d.getMonth() + 1, 1)
    );
  }, [view]);

  const load = React.useCallback(async () => {
    try {
      const [psRes, gsRes, tsRes, ssRes] = await Promise.allSettled([
        fetchProjects(),
        fetchGoals(),
        fetchTasks(),
        fetchSprints(),
      ]);

      const ps = psRes.status === "fulfilled" ? psRes.value : [];
      const gs = gsRes.status === "fulfilled" ? gsRes.value : [];
      const ts = tsRes.status === "fulfilled" ? tsRes.value : [];
      const ss = ssRes.status === "fulfilled" ? ssRes.value : [];

      const projById = new Map(ps.map((p) => [p.id, p]));
      const sprintById = new Map(ss.map((s) => [s.id, s]));

      const projectEvents: CalendarEvent[] = ps
        .filter((p) => !!p.dueDate)
        .map((p) => ({
          date: (p.dueDate as string).slice(0, 10),
          title: `Proyecto: ${p.name}${p.completed ? " · Finalizado" : ""}`,
          href: `/projects/${p.id}/kanban`,
          completed: !!p.completed,
        }));

      const goalEvents: CalendarEvent[] = gs
        .filter((g) => !!g.dueDate)
        .map((g) => ({
          date: (g.dueDate as string).slice(0, 10),
          title: `Meta: ${g.title}`,
          href: `/goals`,
          completed: (g.progress ?? 0) >= 100,
        }));

      const taskEvents: CalendarEvent[] = ts
        .filter((t: any) => !!t.dueDate)
        .map((t: any) => {
          const projectName = projById.get(t.projectId)?.name ?? t.projectId;
          const sprintTag: string | undefined = (t.tags ?? []).find((x: string) => x.startsWith("sprint-"));
          const sprintId = sprintTag ? sprintTag.slice(7) : undefined;
          const sprintName = sprintId ? sprintById.get(sprintId)?.name : undefined;

          const assigned =
            isAdmin(user) && t.assigneeId
              ? assigneeMap[String(t.assigneeId)] ?? String(t.assigneeId).slice(0, 6)
              : undefined;

          return {
            date: (t.dueDate as string).slice(0, 10),
            title: `Tarea: ${t.title} · Proyecto: ${projectName}${sprintName ? " · Sprint: " + sprintName : ""}${assigned ? " · Asignado: " + assigned : ""}`,
            href: `/projects/${t.projectId}/list`,
            completed: t.status === "Done",
          };
        });

      const sprintEvents: CalendarEvent[] = ss.flatMap((s: any) => {
        const projectName = projById.get(s.projectId)?.name ?? s.projectId;
        const suffix = s.completed ? " · Finalizado" : "";
        const startEvt: CalendarEvent = {
          date: (s.startDate as string).slice(0, 10),
          title: `Sprint: ${s.name} · ${projectName} · Inicio${suffix}`,
          href: `/projects/${s.projectId}/sprints`,
          completed: !!s.completed,
        };
        const endEvt: CalendarEvent = {
          date: (s.endDate as string).slice(0, 10),
          title: `Sprint: ${s.name} · ${projectName} · Fin${suffix}`,
          href: `/projects/${s.projectId}/sprints`,
          completed: !!s.completed,
        };
        return [startEvt, endEvt];
      });

      setEvents([...projectEvents, ...goalEvents, ...taskEvents, ...sprintEvents]);
    } catch {
      // ignore errors in calendar load
    }
  }, []);

  React.useEffect(() => {
    let mounted = true;
    load();

    const onVis = () => {
      if (document.visibilityState === "visible") {
        load();
      }
    };

    const onCalendarRefresh = () => {
      load();
    };

    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("calendar:refresh", onCalendarRefresh as any);

    return () => {
      mounted = false;
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("calendar:refresh", onCalendarRefresh as any);
    };
  }, [load]);

  // Para admin/manager, cargar mapa de asignados id -> "Nombre (email)" una vez
  React.useEffect(() => {
    let mounted = true;
    async function loadUsersForRole() {
      if (!(isAdmin(user) || isManager(user))) {
        setAssigneeMap({});
        return;
      }
      try {
        const list = await fetchUsers({ role: "developer" });
        if (!mounted) return;
        const map: Record<string, string> = {};
        list.forEach((u: SimpleUser) => {
          map[u.id] = `${u.name} (${u.email})`;
        });
        setAssigneeMap(map);
      } catch {
        if (mounted) setAssigneeMap({});
      }
    }
    loadUsersForRole();
    return () => {
      mounted = false;
    };
  }, [user]);

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-bold tracking-tight">Calendario</h1>
        <div className="flex items-center gap-2">
          <CalendarToolbar
            view={view}
            onViewChange={setView}
            current={current}
            onPrev={onPrev}
            onNext={onNext}
            onToday={onToday}
          />
          <Button variant="outline" onClick={load}>Refrescar</Button>
        </div>
      </div>


      <CalendarView view={view} events={events} current={current} />
    </div>
  );
}
