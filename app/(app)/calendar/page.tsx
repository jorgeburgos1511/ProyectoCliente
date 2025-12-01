"use client";

import * as React from "react";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import CalendarToolbar from "@/components/calendar/CalendarToolbar";
import CalendarView from "@/components/calendar/CalendarView";
import { fetchProjects } from "@/services/api/projects.service";
import { fetchGoals } from "@/services/api/goals.service";
import type { CalendarEvent } from "@/components/calendar/CalendarView";

type View = "month" | "week" | "day";

export default function CalendarPage() {
  const [view, setView] = React.useState<View>("month");
  const [events, setEvents] = React.useState<CalendarEvent[]>([]);
  const [current, setCurrent] = React.useState<Date>(new Date());

  const onToday = React.useCallback(() => {
    setCurrent(new Date());
  }, []);

  const onPrev = React.useCallback(() => {
    setCurrent((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }, []);

  const onNext = React.useCallback(() => {
    setCurrent((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }, []);

  React.useEffect(() => {
    let mounted = true;
    Promise.all([fetchProjects(), fetchGoals()])
      .then(([ps, gs]) => {
        if (!mounted) return;
        const projectEvents: CalendarEvent[] = ps
          .filter((p) => !!p.dueDate)
          .map((p) => ({
            date: (p.dueDate as string).slice(0, 10),
            title: `Proyecto: ${p.name}`,
            href: `/projects/${p.id}/kanban`,
          }));
        const goalEvents: CalendarEvent[] = gs
          .filter((g) => !!g.dueDate)
          .map((g) => ({
            date: (g.dueDate as string).slice(0, 10),
            title: `Meta: ${g.title}`,
            href: `/goals`,
          }));
        setEvents([...projectEvents, ...goalEvents]);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-bold tracking-tight">Calendario</h1>
        <CalendarToolbar
          view={view}
          onViewChange={setView}
          current={current}
          onPrev={onPrev}
          onNext={onNext}
          onToday={onToday}
        />
      </div>


      <CalendarView view={view} events={events} current={current} />
    </div>
  );
}
