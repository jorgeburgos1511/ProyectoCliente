# Patrón Server/Client + metadata (Next.js App Router)

Objetivo: Evitar errores de Next.js por exportar `metadata` o `generateMetadata` en Client Components.

Regla básica
- Solo Server Components pueden exportar `export const metadata` o `export async function generateMetadata`.
- Si una página o layout necesita hooks/efectos o módulos de cliente (toasts, Zustand, useParams, usePathname, etc.), mueva esa UI a un componente Client y deje el `page.tsx`/`layout.tsx` como Server.

Patrón recomendado por ruta
1) Wrapper Server (`page.tsx` o `layout.tsx`):
   - No incluir `"use client"`.
   - Puede exportar `metadata`.
   - Solo importa y renderiza al Componente Client (no importar helpers cliente como `lib/toast` aquí).
   - Ejemplo:
     ```tsx
     import MiPaginaClient from "./MiPaginaClient";

     export const metadata = { title: "Mi Título | TaskFlow" };

     export default function Page() {
       return <MiPaginaClient />;
     }
     ```

2) Componente Client (`MiPaginaClient.tsx`):
   - Inicia con `"use client"`.
   - Contiene hooks, toasts, stores, navegación de cliente, etc.
   - Ejemplo:
     ```tsx
     "use client";
     import * as React from "react";
     import { toast } from "@/lib/toast";

     export default function MiPaginaClient() {
       React.useEffect(() => { /* ... */ }, []);
       return <div>UI</div>;
     }
     ```

3) Providers globales Cliente:
   - Centralizar toasts y demás en `app/providers.tsx` (Client) y envolver en `app/layout.tsx` (Server).
   - Evita que páginas deban ser Client solo por el toaster.

Do / Don’t
- Do: `page.tsx` sin `"use client"` + `export const metadata` + render de `SomePageClient`.
- Do: `SomePageClient.tsx` con `"use client"`; ahí colocar hooks (useState/useEffect), toasts, Zustand, `useParams`, `usePathname`, etc.
- Don’t: Exportar `metadata` en cualquier archivo con `"use client"`.
- Don’t: Importar helpers cliente (`lib/toast`, stores) directamente en archivos Server con metadata.

Validaciones automáticas (script)
- Ejecuta:
  ```
  npm run check:metadata
  ```
  Falla si encuentra `use client` y `metadata` en el mismo archivo `.tsx`.

Ejemplos aplicados en este repo
- `app/(app)/projects/page.tsx` (Server) -> renderiza `ProjectsPageClient.tsx` (Client).
- `app/(app)/profile/page.tsx` (Server) -> renderiza `ProfilePageClient.tsx` (Client).
- `app/(app)/my-work/page.tsx` (Server) -> renderiza `MyWorkPageClient.tsx` (Client).
- `app/(app)/goals/page.tsx` (Server) -> renderiza `GoalsPageClient.tsx` (Client).
- `app/(app)/admin/users/page.tsx` (Server) -> renderiza `AdminUsersPageClient.tsx` (Client).
- `app/(app)/dashboard/page.tsx` (Server) -> renderiza `DashboardPageClient.tsx` (Client).
- Rutas anidadas con hooks cliente: `projects/[id]/kanban/page.tsx` (Server) -> `KanbanPageClient.tsx` (Client).

Notas
- Es válido que un Server Component importe un Client Component (Next.js lo permite). El foco del error es NO convertir el archivo con `metadata` en cliente (no poner `"use client"` ahí).
- Para páginas públicas `/login` y `/register`, el wrapper Server puede importar componentes cliente como `AuthCard` y exportar metadata sin problema, ya que el wrapper sigue siendo Server.
