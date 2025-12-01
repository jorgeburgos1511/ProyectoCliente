"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

type View = "month" | "week" | "day";

export default function CalendarToolbar({
  view,
  onViewChange,
  current,
  onPrev,
  onNext,
  onToday,
}: {
  view: View;
  onViewChange: (v: View) => void;
  current: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}) {
  const label = React.useMemo(() => {
    try {
      return current.toLocaleDateString("es-MX", {
        month: "long",
        year: "numeric",
      });
    } catch {
      return `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}`;
    }
  }, [current]);

  return (
    <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={onToday}>
          Hoy
        </Button>
        <Button size="sm" variant="outline" onClick={onPrev} aria-label="Mes anterior">
          ←
        </Button>
        <Button size="sm" variant="outline" onClick={onNext} aria-label="Mes siguiente">
          →
        </Button>
        <div className="ml-2 text-sm font-medium capitalize">{label}</div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={view === "month" ? "default" : "outline"}
          onClick={() => onViewChange("month")}
        >
          Mes
        </Button>
        <Button
          size="sm"
          variant={view === "week" ? "default" : "outline"}
          onClick={() => onViewChange("week")}
        >
          Semana
        </Button>
        <Button
          size="sm"
          variant={view === "day" ? "default" : "outline"}
          onClick={() => onViewChange("day")}
        >
          Día
        </Button>
      </div>
    </div>
  );
}
