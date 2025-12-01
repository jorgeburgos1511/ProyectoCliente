export default function PointsStreakWidget() {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-2 text-sm font-semibold">Puntos y racha</div>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-muted-foreground">Puntos (últimos 7 días)</div>
          <div className="text-2xl font-bold">34</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">Racha</div>
          <div className="text-2xl font-bold">5 días 🔥</div>
        </div>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full w-3/5 bg-foreground/80" />
      </div>
      <div className="mt-2 text-xs text-muted-foreground">Meta semanal: 50 pts</div>
    </div>
  );
}
