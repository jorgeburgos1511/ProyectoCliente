export default function RecentActivity() {
  const items = [
    { id: "a1", text: "Ana movió 'Board Kanban' a Done", time: "hace 2h" },
    { id: "a2", text: "Bruno creó etiqueta 'bug'", time: "hace 5h" },
    { id: "a3", text: "Carla actualizó sprint 'Sprint 2'", time: "ayer" },
  ];
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-2 text-sm font-semibold">Actividad reciente</div>
      <ul className="space-y-3 text-sm">
        {items.map((i) => (
          <li key={i.id} className="flex items-start justify-between gap-3">
            <span>{i.text}</span>
            <span className="text-xs text-muted-foreground">{i.time}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
