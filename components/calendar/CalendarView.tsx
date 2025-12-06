"use client";

import Link from "next/link";

type View = "month" | "week";
export type CalendarEvent = {
  date: string | Date;
  title: string;
  href?: string;
  completed?: boolean;
};

export default function CalendarView({
  view,
  events = [],
  current,
}: {
  view: View;
  events?: CalendarEvent[];
  current: Date;
}) {
  // Helpers shared by views
  type LocalEvt = CalendarEvent & { __d: Date };
  const toLocalDate = (value: string | Date): Date => {
    if (value instanceof Date) return value;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [yy, mm, dd] = value.split("-").map(Number);
      return new Date(yy, mm - 1, dd);
    }
    return new Date(value);
  };

  const localEvts: LocalEvt[] = events
    .map((evt) => ({ ...evt, __d: toLocalDate(evt.date) as Date }))
    .filter((evt) => !isNaN(evt.__d.getTime()));

  if (view === "week") {
    // Compute Monday..Sunday of the week that contains "current"
    const cur = new Date(current.getFullYear(), current.getMonth(), current.getDate());
    const jsDay = cur.getDay(); // 0..6 (Sun..Sat)
    const mondayOffset = (jsDay + 6) % 7; // 0 for Monday
    const monday = new Date(cur);
    monday.setDate(cur.getDate() - mondayOffset);
    const days: Date[] = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });

    // Filter events to this exact week (inclusive)
    const start = days[0];
    const end = days[6];
    const weekEvents = localEvts.filter((evt) => evt.__d >= start && evt.__d <= end);

    // Group by day number (1..31) and month/year match of each "days[i]"
    const byKey = new Map<string, CalendarEvent[]>();
    const keyOf = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    for (const day of days) {
      byKey.set(keyOf(day), []);
    }
    for (const evt of weekEvents) {
      const k = keyOf((evt as LocalEvt).__d);
      if (!byKey.has(k)) byKey.set(k, []);
      const { __d, ...keep } = evt as any;
      byKey.get(k)!.push(keep as CalendarEvent);
    }

    const shortDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

    return (
      <div className="rounded-lg border bg-card p-4">
        <div className="mb-2 text-sm font-semibold">Vista Semana</div>

        <div className="mb-2 grid grid-cols-7 gap-2 text-[11px] text-muted-foreground">
          {days.map((d, i) => (
            <div key={i} className="px-2 py-1">
              {shortDays[i]} {d.getDate()}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {days.map((d, i) => {
            const k = keyOf(d);
            const dayEvents = byKey.get(k) ?? [];
            return (
              <div key={i} className="min-h-[140px] rounded border p-2 text-xs">
                <div className="mb-1 text-muted-foreground">Día {d.getDate()}</div>
                <div className="flex flex-col gap-1">
                  {dayEvents.slice(0, 5).map((e, idx) =>
                    e.href ? (
                      <Link
                        key={idx}
                        href={e.href}
                        className={`truncate rounded px-2 py-1 text-[11px] ${
                          e.completed
                            ? "bg-emerald-500/15 text-emerald-700 line-through border border-emerald-500/30"
                            : "bg-primary/10 hover:bg-primary/20"
                        }`}
                        title={e.title}
                      >
                        {e.completed ? "✓ " : ""}
                        {e.title}
                      </Link>
                    ) : (
                      <div
                        key={idx}
                        className={`truncate rounded px-2 py-1 text-[11px] ${
                          e.completed
                            ? "bg-emerald-500/15 text-emerald-700 line-through border border-emerald-500/30"
                            : "bg-primary/10"
                        }`}
                        title={e.title}
                      >
                        {e.completed ? "✓ " : ""}
                        {e.title}
                      </div>
                    )
                  )}
                  {dayEvents.length > 5 && (
                    <div className="text-[11px] text-muted-foreground">
                      +{dayEvents.length - 5} más
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Month view (real calendar grid)
  const y = current.getFullYear();
  const m = current.getMonth();

  const first = new Date(y, m, 1);
  const daysInMonth = new Date(y, m + 1, 0).getDate();

  // Compute leading empty cells so that Monday=0 ... Sunday=6
  const lead = (first.getDay() + 6) % 7; // JS getDay: Sun=0...Sat=6  -> shift so Mon=0
  const totalCells = Math.ceil((lead + daysInMonth) / 7) * 7; // 28/35/42

  // Filter events to current month (LOCAL) and group by day
  const monthEvents = localEvts.filter(
    (evt) => evt.__d.getFullYear() === y && evt.__d.getMonth() === m
  );

  const byDay = new Map<number, CalendarEvent[]>();
  for (const evt of monthEvents) {
    const day = (evt as LocalEvt).__d.getDate(); // 1..31 local
    if (!byDay.has(day)) byDay.set(day, []);
    const { __d, ...keep } = evt as any;
    byDay.get(day)!.push(keep as CalendarEvent);
  }

  const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-2 text-sm font-semibold">Vista Mes</div>

      {/* Weekday headers */}
      <div className="mb-2 grid grid-cols-7 gap-2 text-[11px] text-muted-foreground">
        {weekDays.map((d) => (
          <div key={d} className="px-2 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Month grid */}
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: totalCells }).map((_, i) => {
          const dayNum = i - lead + 1;
          const inMonth = dayNum >= 1 && dayNum <= daysInMonth;
          const dayEvents = inMonth ? byDay.get(dayNum) ?? [] : [];

          return (
            <div
              key={i}
              className={`min-h-[100px] rounded border p-2 text-xs ${inMonth ? "" : "opacity-40"}`}
            >
              <div className="mb-1 text-muted-foreground">
                {inMonth ? `Día ${dayNum}` : ""}
              </div>
              <div className="flex flex-col gap-1">
                {dayEvents.slice(0, 3).map((e, idx) =>
                  e.href ? (
                    <Link
                      key={idx}
                      href={e.href}
                      className={`truncate rounded px-2 py-1 text-[11px] ${
                        e.completed
                          ? "bg-emerald-500/15 text-emerald-700 line-through border border-emerald-500/30"
                          : "bg-primary/10 hover:bg-primary/20"
                      }`}
                      title={e.title}
                    >
                      {e.completed ? "✓ " : ""}
                      {e.title}
                    </Link>
                  ) : (
                    <div
                      key={idx}
                      className={`truncate rounded px-2 py-1 text-[11px] ${
                        e.completed
                          ? "bg-emerald-500/15 text-emerald-700 line-through border border-emerald-500/30"
                          : "bg-primary/10"
                      }`}
                      title={e.title}
                    >
                      {e.completed ? "✓ " : ""}
                      {e.title}
                    </div>
                  )
                )}
                {dayEvents.length > 3 && (
                  <div className="text-[11px] text-muted-foreground">
                    +{dayEvents.length - 3} más
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
