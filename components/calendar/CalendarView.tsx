"use client";

import Link from "next/link";

type View = "month" | "week" | "day";
export type CalendarEvent = {
  date: string | Date;
  title: string;
  href?: string;
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
  if (view === "day") {
    // Placeholder day grid
    return (
      <div className="rounded-lg border bg-card p-4">
        <div className="mb-2 text-sm font-semibold">Vista Día</div>
        <div className="grid grid-rows-6 gap-2">
          {["09:00", "11:00", "13:00", "15:00", "17:00", "19:00"].map((h) => (
            <div key={h} className="flex items-center gap-3 rounded border p-3 text-xs">
              <div className="w-16 shrink-0 text-muted-foreground">{h}</div>
              <div className="h-10 w-full rounded border border-dashed" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (view === "week") {
    const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
    return (
      <div className="rounded-lg border bg-card p-4">
        <div className="mb-2 text-sm font-semibold">Vista Semana</div>
        <div className="grid grid-cols-7 gap-2">
          {days.map((d) => (
            <div key={d} className="min-h-[160px] rounded border p-2">
              <div className="mb-1 text-xs text-muted-foreground">{d}</div>
              <div className="h-24 rounded border border-dashed" />
            </div>
          ))}
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
  // Normalize string dates like "YYYY-MM-DD" to local dates to avoid TZ shifts
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
  const monthEvents = localEvts.filter(
    (evt) => evt.__d.getFullYear() === y && evt.__d.getMonth() === m
  );

  const byDay = new Map<number, CalendarEvent[]>();
  for (const evt of monthEvents) {
    const day = (evt as LocalEvt).__d.getDate(); // 1..31 local
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push({ date: evt.date, title: evt.title, href: evt.href });
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
                      className="truncate rounded bg-primary/10 px-2 py-1 text-[11px] hover:bg-primary/20"
                      title={e.title}
                    >
                      {e.title}
                    </Link>
                  ) : (
                    <div
                      key={idx}
                      className="truncate rounded bg-primary/10 px-2 py-1 text-[11px]"
                      title={e.title}
                    >
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
