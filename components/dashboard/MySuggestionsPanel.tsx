export default function MySuggestionsPanel() {
  const suggestions = [
    { id: "s1", title: "Mover 'Landing pública' a Done si está aprobada", impact: "Baja" },
    { id: "s2", title: "Crear etiquetas para priorizar bugs", impact: "Media" },
    { id: "s3", title: "Revisar fechas de sprint actuales", impact: "Alta" },
  ];
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-2 text-sm font-semibold">Sugerencias para mí</div>
      <ul className="space-y-2 text-sm">
        {suggestions.map((s) => (
          <li key={s.id} className="flex items-start justify-between gap-3">
            <span>{s.title}</span>
            <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {s.impact}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
