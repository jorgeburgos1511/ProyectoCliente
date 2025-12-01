import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="container mx-auto px-4">
      <section className="mx-auto grid min-h-[60vh] max-w-4xl place-items-center py-16 text-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted px-3 py-1 text-xs text-muted-foreground">
            Demo estática • Sin backend • Next.js 14 + Tailwind + shadcn/ui
          </div>
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            TaskFlow Cliente
          </h1>
          <p className="mx-auto max-w-2xl text-balance text-muted-foreground">
            Navega por las vistas mock: Dashboard, Proyectos, Kanban, Lista, Sprints, Etiquetas,
            Mi trabajo, Metas, Calendario, Perfil y Administración/Usuarios.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/login">Ingresar</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link href="/register">Crear cuenta</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 pb-20 sm:grid-cols-3">
        {[
          { title: "Proyectos", desc: "Listado con crear/editar (mock), estados vacíos y filtros dummy." },
          { title: "Kanban", desc: "Columnas Todo/Doing/Done; drag visual (no funcional)." },
          { title: "Calendario", desc: "Toolbar Mes/Semana/Día y grilla estática." },
        ].map((f) => (
          <div key={f.title} className="rounded-lg border bg-card p-6">
            <h3 className="mb-2 text-lg font-semibold">{f.title}</h3>
            <p className="text-sm text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
