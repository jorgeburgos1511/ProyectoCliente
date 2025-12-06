import { cn } from "@/lib/utils";

type Stat = {
  label: string;
  value: string | number;
  trend?: string;
};

const stats: Stat[] = [
  { label: "Tareas abiertas", value: 24, trend: "+3 esta semana" },
  { label: "Sprints activos", value: 2, trend: "Sprint 5 / Sprint 1" },
  { label: "Mis puntos", value: 34, trend: "+8 esta semana" },
  { label: "Proyectos", value: 2, trend: "TF, WR" },
];

export default function SummaryCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className={cn("rounded-lg border bg-card p-4")}>
          <div className="text-sm text-muted-foreground">{s.label}</div>
          <div className="mt-2 text-2xl font-bold">{s.value}</div>
          {s.trend && <div className="mt-1 text-xs text-muted-foreground">{s.trend}</div>}
        </div>
      ))}
    </div>
  );
}
