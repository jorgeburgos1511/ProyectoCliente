import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="container mx-auto px-4">
      <section className="mx-auto grid min-h-[60vh] max-w-5xl place-items-center py-16 text-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted px-3 py-1 text-xs text-muted-foreground">
            Full‑stack • Next.js 16 + React 19 + MongoDB + Socket.IO + Tailwind + shadcn/ui
          </div>
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            TaskFlow UI + API
          </h1>
          <p className="mx-auto max-w-2xl text-balance text-muted-foreground">
            Administra proyectos, metas, tareas y sprints con autenticación (credenciales y Google),
            control por propietario, tiempo real y calendario (Mes/Semana). Almacenamiento de archivos en S3
            y documentación en Swagger.
          </p>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/login">Ingresar</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link href="/register">Crear cuenta</Link>
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs text-muted-foreground">
            <span>¿Listo para explorar?</span>
            <Link href="/dashboard" className="underline underline-offset-2">
              Ir al Dashboard
            </Link>
            <span>·</span>
            <Link href="/api-docs" className="underline underline-offset-2">
              Ver API Docs
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 pb-20 sm:grid-cols-2 lg:grid-cols-3">
        {[
          {
            title: "Proyectos",
            desc:
              "CRUD real con dueDate y control por propietario (owner). Sólo ves tus proyectos.",
            href: "/projects",
            cta: "Abrir Proyectos",
          },
          {
            title: "Tareas",
            desc:
              "Asignación automática al creador, prioridades y estados. Vista Kanban y Lista por proyecto.",
            href: "/projects",
            cta: "Ir a proyectos",
          },
          {
            title: "Sprints",
            desc:
              "Crea sprints para tus proyectos y asigna tareas. Solo ves sprints de tus proyectos.",
            href: "/projects",
            cta: "Ver Sprints",
          },
          {
            title: "Metas",
            desc:
              "Define metas con progreso y fecha. Finaliza metas al 100% y visualízalas en el calendario.",
            href: "/goals",
            cta: "Ver Metas",
          },
          {
            title: "Calendario (Mes/Semana)",
            desc:
              "Eventos de Proyectos/Metas/Tareas/Sprints con estilo para finalizados. Navegación Hoy/Prev/Next.",
            href: "/calendar",
            cta: "Abrir Calendario",
          },
          {
            title: "Tiempo real y Archivos",
            desc:
              "Feed de actividad en vivo con Socket.IO. Subida de archivos a S3 por proyecto.",
            href: "/projects",
            cta: "Explorar",
          },
        ].map((f) => (
          <div key={f.title} className="rounded-lg border bg-card p-6">
            <h3 className="mb-2 text-lg font-semibold">{f.title}</h3>
            <p className="mb-4 text-sm text-muted-foreground">{f.desc}</p>
            <Button asChild size="sm" variant="outline">
              <Link href={f.href}>{f.cta}</Link>
            </Button>
          </div>
        ))}
      </section>
    </main>
  );
}
