# TaskFlow UI + API (Next.js 16, TypeScript, Mongo, Socket.IO)

Aplicación full‑stack basada en Next.js (App Router) con UI en React y API integrada. Persistencia real con MongoDB/Mongoose, autenticación JWT (credenciales y Google OAuth), control de acceso por roles/participación, documentación OpenAPI/Swagger y tiempo real con Socket.IO. La UI expone flujos reales (Proyectos/Metas/Tareas/Sprints, Calendario, Mi trabajo, Dashboard, Archivos S3) con énfasis en seguridad y DX.

Tabla de contenidos
- Introducción
- Novedades/Resumen de cambios recientes
- Características principales
- Arquitectura y estructura
- Modelado de datos (Mongoose)
- Autenticación y autorización
- Reglas de visibilidad (owner|membership|participation)
- Endpoints (resumen)
- Cliente (servicios y UI)
- Calendario (Mes/Semana, dueDate)
- Kanban (drag & drop con persistencia)
- Archivos (S3) y endpoints
- Variables de entorno
- Instalación, ejecución y scripts
- Pruebas (unitarias y E2E)
- Seguridad y buenas prácticas
- Roadmap y limitaciones
- Licencia

## Introducción
- Frontend en Next.js 16 (App Router) + React 19 + TypeScript + Tailwind v4 + shadcn/ui.
- Backend API en route handlers de Next (app/api/**).
- Persistencia con MongoDB/Mongoose.
- Autenticación con JWT (credenciales) y Google OAuth (authorization code).
- Documentación REST con Swagger UI en /api-docs.
- Socket.IO para tiempo real (servidor dedicado).
- Almacenamiento de archivos en S3 (por proyecto).

## Novedades/Resumen de cambios recientes
- Visibilidad y permisos ampliados:
  - Proyectos (GET) para developer: ahora ve proyectos donde participa aunque no sea miembro explícito (miembro del proyecto, miembro de algún sprint del proyecto o con tareas asignadas en ese proyecto).
  - Proyectos (GET) para manager/admin: owner o miembro.
  - Sprints (GET) para usuario autenticado: sprints de proyectos en los que participa (owner/miembro) y sprints donde figure en members.
  - Tareas (GET): managers/admin ven tareas de proyectos que poseen (y sus propias); developers ven solo sus tareas.
- Miembros de sprint: al crear un sprint se heredan automáticamente los miembros del proyecto (members).
- Asignación y edición de tareas:
  - Manager/admin pueden asignar tareas (con saneamiento por dominio para manager).
  - Developer puede editar sus propias tareas (status, prioridad, fecha, puntos, descripción) y ahora también sus etiquetas (tags).
- Kanban:
  - Drag & drop persistente: mover una tarjeta entre columnas (Todo/Doing/Done) actualiza el estado en la API y en la UI.
  - Badge “Asignado: Nombre (email)” visible para admin/manager en las tarjetas.
- Calendario:
  - Para admin/manager, los eventos de tarea incluyen “Asignado: Nombre (email)” en el título.
  - Manager y admin ven tareas de proyectos que poseen; developers ven sus propias tareas.
- Selección de miembros en ProjectForm:
  - Se reemplazó el multiselect por lista de checkboxes; búsqueda local; filtros para admin (dominio/solo developers); acciones rápidas “Seleccionar todos/ Limpiar”.
- Archivos (S3):
  - Nuevos endpoints: /api/files (GET, POST) y /api/files/[id] (DELETE) con control por participación en proyecto.
  - UI de subida/listado/eliminación por proyecto (drag & drop).
- UI de persistencia al editar:
  - ProjectForm/SprintForm/TaskForm preseleccionan valores actuales (miembros, fechas, asignado, etiquetas).
- Tests: suite unitaria en verde (14/14).

## Características principales
- Autenticación por credenciales y Google OAuth.
- Proyectos, Metas, Tareas y Sprints:
  - CRUD real con control por owner/rol/participación y normalización de fechas.
  - Tareas: estados y prioridades; etiquetas; manager/admin pueden asignar; developer edita las suyas.
- UI:
  - Dashboard con métricas, próximas entregas y sprints activos.
  - Mi trabajo: mis proyectos (por participación), mis tareas asignadas, sprints de mis proyectos.
  - Calendario: Mes y Semana; eventos de Proyectos/Metas/Tareas/Sprints con estilos y “Asignado: Nombre” (admin/manager).
  - Kanban por proyecto (Todo/Doing/Done) con drag & drop persistente.
  - Admin/Users (solo admin).
  - Archivos S3 por proyecto.
- OpenAPI en /api-docs y JSON en /api/docs/openapi.

## Arquitectura y estructura
Raíz
- app/ App Router (páginas Server/Client + API)
- components/ Componentes UI (shadcn/ui, layout, tablas, formularios, realtime)
- lib/ Utilidades (db, jwt, roles, permissions, socket server/cliente, s3, utils, toast)
- models/ Modelos Mongoose
- services/ Servicios de cliente (fetch)
- hooks/ Hooks (useSocket)
- cypress/, test/ Pruebas E2E y unitarias
- docs/ Documentación adicional

Rutas UI (extracto)
- / (Landing) con enlaces a /login, /register, /dashboard y /api-docs.
- /(app)/dashboard
- /(app)/projects, /(app)/projects/[id]/*
- /(app)/goals
- /(app)/my-work
- /(app)/calendar (Mes, Semana)
- /(app)/profile
- /(app)/admin/users (solo admin)
- /api-docs (UI Swagger)

## Modelado de datos (Mongoose)
User (models/User.ts)
- name, email (único, lowercase), password?, role, provider, googleId?, avatarUrl?, timestamps
Project (models/Project.ts)
- name, key (uppercase 2..6), ownerId, members[], dueDate?, completed?, timestamps
Goal (models/Goal.ts)
- title, progress (0..100), projectId?, ownerId?, dueDate?, timestamps
Task (models/Task.ts)
- projectId, title, status (“Todo”|“Doing”|“Done”), priority (“High”|“Medium”|“Low”),
  assigneeId?, dueDate?, points?, tags?, description?, timestamps
Sprint (models/Sprint.ts)
- projectId, name, startDate, endDate, goal?, completed?, members[], timestamps

## Autenticación y autorización
- JWT firmado con JWT_SECRET; expiración configurable (JWT_EXPIRES_IN).
- Authorization: Bearer <token> en endpoints protegidos.
- AuthProvider:
  - Persiste token y user en localStorage (get/setAuthToken, get/setAuthUser).
  - Rehidratación automática en refresco.

## Reglas de visibilidad (owner|membership|participation)
- Proyectos (GET):
  - Developer: proyectos donde participa (miembro directo del proyecto, o members del sprint del proyecto, o con tareas asignadas en ese proyecto).
  - Manager/Admin: proyectos donde es owner o miembro.
- Sprints (GET):
  - Sprints de proyectos donde el usuario es owner/miembro y sprints donde figure en members.
- Tareas (GET):
  - Manager/Admin: tareas de proyectos que poseen (y propias).
  - Developer: solo tareas asignadas al usuario.
- Goals (POST):
  - Se permite crear metas si el usuario participa en el proyecto (ver participatesInProject).

## Endpoints (resumen)
Auth
- POST /api/auth/register, /api/auth/login, /api/auth/google

Projects
- GET /api/projects
- POST /api/projects
- GET/PUT/DELETE /api/projects/[id]

Goals
- GET /api/goals
- POST /api/goals (title requerido; dueDate opcional; permite projectId si participa)

Tasks
- GET /api/tasks?projectId=
  - manager/admin: tareas de proyectos que posee + propias
  - developer: solo sus tareas
- POST /api/tasks
  - developer: asignado a sí mismo; manager/admin pueden asignar (saneado)
- GET/PUT/DELETE /api/tasks/[id]
  - developer puede editar su propia tarea (incluidas etiquetas)

Sprints
- GET /api/sprints?projectId=
- POST /api/sprints (hereda members del proyecto al crear)
- GET/PUT/DELETE /api/sprints/[id]

Files (S3)
- GET /api/files?projectId=
- POST /api/files (multipart/form-data: file, projectId)
- DELETE /api/files/[id]?projectId=

## Cliente (servicios y UI)
Servicios (services/api/**)
- auth.service.ts: login/register/google; persistencia de token y user.
- projects/goals/tasks/sprints/users*.service.ts:
  - GET protegidos envían Authorization (Bearer token).
  - tasks.service: tipado incluye tags y dueDate ISO.

Capa UI (extracto)
- ProjectForm:
  - Checkboxes de miembros (sin Ctrl/Cmd), búsqueda; para admin filtros por dominio/rol; acciones rápidas seleccionar/limpiar; preselección en edición.
- SprintForm:
  - Fechas normalizadas y prellenadas al editar; herencia de members en API.
- TaskForm:
  - Preselección de todos los campos al editar (incluye dueDate normalizado y asignado actual visible en select, aun si no está en la lista); editor de etiquetas.
- ProjectsTable:
  - Developer ve solo proyectos donde participa; oculta botón “Crear”.
  - Columna Owner muestra ownerName/email devueltos por API.
- Kanban:
  - Drag & drop persistente; badge “Asignado: Nombre (email)” para admin/manager.
- Calendar:
  - “Asignado: Nombre (email)” en tareas para admin/manager; botón “Refrescar”.

## Calendario (Mes/Semana)
- Vista Mes y Semana.
- Eventos:
  - Proyectos (dueDate) con estilo especial si completed=true.
  - Metas (dueDate) finalizadas si progress≥100.
  - Tareas (dueDate) finalizadas si status=Done; título incluye Proyecto y Sprint (si etiqueta sprint-<id>) y, para admin/manager, el asignado.
  - Sprints (Inicio/Fin) con estilo de finalizado si completed=true.
- Normalizaciones de fechas:
  - Cliente: “YYYY‑MM‑DD” se trata como fecha local.
  - Servidor: “YYYY‑MM‑DD” se guarda como Date.UTC(..., 12:00) para evitar desfases.
- Botón “Refrescar” y escucha de “calendar:refresh”.

## Kanban (drag & drop con persistencia)
- TaskCard es draggable y Column acepta drop; KanbanBoard actualiza el estado de la tarea y persiste con updateTask.
- Developer puede cambiar el estado de sus tareas; manager/admin conservan sus permisos de edición.

## Archivos (S3) y endpoints
- /api/files (GET, POST) y /api/files/[id] (DELETE) con validación de participación en el proyecto.
- UI en /(app)/projects/[id]/files: drag & drop, listado, eliminación.
- lib/s3.ts: helpers de subida/eliminación con AWS SDK v3.

## Variables de entorno (.env)
Server/API
- MONGODB_URI=mongodb://localhost:27017/taskflow
- JWT_SECRET=un_secret_largo_aleatorio
- JWT_EXPIRES_IN=7d
- ALLOWLIST_MANAGER_DOMAINS=empresa.com,otra.com  (opcional: auto-rol manager por dominio)
- GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI

Client
- NEXT_PUBLIC_API_URL=http://localhost:3000/api
- NEXT_PUBLIC_GOOGLE_CLIENT_ID=<client_id_publico>

Sockets (opcional)
- SOCKET_PORT=3001
- NEXT_PUBLIC_SOCKET_PORT=3001
- NEXT_PUBLIC_SOCKET_URL=<url socket> (prioritaria)
- NEXT_PUBLIC_SITE_URL (CORS prod)

S3 (opcional)
- AWS_S3_BUCKET, AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY

## Instalación, ejecución y scripts
Instalación
- npm i

Desarrollo
- npm run dev
- Abrir http://localhost:3000

Build/Start
- npm run build
- npm start

Docs/OpenAPI
- http://localhost:3000/api-docs

Lint/Tests/E2E
- Lint: npm run lint
- Unit tests:
  - npm run test / npm run test:watch / npm run test:ui / npm run coverage
- Cypress:
  - GUI: npm run cy:open
  - Headless: npm run e2e

## Pruebas
Unitarias (Vitest + Testing Library)
- Entorno happy-dom (config en test/setup.ts).
- Mocks de next/navigation, toast, etc.
- Estado actual: 14/14 tests en verde.

E2E (Cypress)
- BaseUrl http://localhost:3000
- Flujos de autenticación, proyectos, tareas, kanban y calendario.

## Seguridad y buenas prácticas
- Recomendado a futuro: cookie httpOnly + SameSite y endpoint /api/auth/me para rehidratación segura.
- Owner/rol/participación:
  - Proyectos: owner o miembro; developer también por participación (sprint/tareas).
  - Sprints: por proyectos visibles y sprint.members.
  - Tareas: manager/admin por proyectos propios + propias; developer solo propias.
- Sockets: validar JWT en handshake; limitar CORS; considerar rate limiting y logs.
- S3: validar size/content-type/keys; evitar datos sensibles en payloads.

## Roadmap y limitaciones
- Consolidar controles de permisos finos (p. ej. mover tareas de otros miembros por manager).
- Presencia RT en memoria (no apto multi‑instancia; considerar Redis).
- Endpoint /api/auth/me y cookies httpOnly para producción.
- Validaciones Zod en handlers API para estandarizar errores.
- Más pruebas de contrato y E2E de flujos completos.

- Capacidades por rol

Admin
- Usuarios:
  - Accede a /admin/users para listar y administrar usuarios (cambiar roles con validaciones).
  - En /api/users puede filtrar por role=developer y domain=empresa.com.
- Proyectos:
  - Crea proyectos (queda como owner).
  - Ve proyectos donde es owner o miembro.
  - Puede finalizar/reabrir y editar proyectos que posee.
  - Puede seleccionar miembros libremente (cualquier developer).
- Sprints:
  - Crear/editar/finalizar sprints de proyectos que posee.
  - Al crear un sprint, sus miembros heredan los members del proyecto.
- Tareas:
  - Ve tareas de proyectos que posee (y sus propias).
  - Puede crear tareas y asignarlas a cualquier developer.
  - Puede editar cualquier tarea de proyectos que posee (título, estado, prioridad, puntos, etiquetas, descripción, fecha, asignado).
- Kanban:
  - Puede mover el estado de cualquier tarea de proyectos que posee (drag & drop con persistencia).
  - Visualiza “Asignado: Nombre (email)” en cada tarjeta.
- Calendario:
  - Ve las tareas del equipo de sus proyectos y “Asignado: Nombre (email)” en el título de los eventos de tarea.
- Archivos:
  - Subir/listar/eliminar archivos en proyectos donde participa (por owner/membresía/participación).
- Metas (Goals):
  - Puede crear metas propias en proyectos donde participa (participatesInProject); ve sus metas.

Manager
- Usuarios:
  - Ve developers únicamente de su mismo dominio (el servidor filtra por dominio del email).
- Proyectos:
  - Crea proyectos (queda como owner).
  - Ve proyectos donde es owner o miembro.
  - Puede finalizar/reabrir y editar proyectos que posee.
  - Puede seleccionar miembros, pero solo developers de su dominio (saneado server‑side).
- Sprints:
  - Crear/editar/finalizar sprints de proyectos que posee.
  - Al crear, los sprints heredan los miembros del proyecto.
- Tareas:
  - Ve tareas de proyectos que posee (y sus propias).
  - Puede crear tareas y asignarlas a developers de su mismo dominio (validado server‑side).
  - Puede editar cualquier tarea de proyectos que posee (título, estado, prioridad, puntos, etiquetas, descripción, fecha, asignado).
- Kanban:
  - Puede mover el estado de tareas de proyectos que posee (persistente).
  - Visualiza “Asignado: Nombre (email)” en las tarjetas.
- Calendario:
  - Ve las tareas del equipo de sus proyectos y “Asignado: Nombre (email)” en eventos de tarea.
- Archivos:
  - Subir/listar/eliminar archivos en proyectos donde participa.
- Metas (Goals):
  - Puede crear metas propias en proyectos donde participa; ve sus metas.

Developer
- Usuarios:
  - No puede listar usuarios (403 en /api/users).
- Proyectos:
  - Ve proyectos donde participa:
    - Ser miembro del proyecto, o
    - Estar en members de algún sprint del proyecto, o
    - Tener tareas asignadas en ese proyecto.
  - No crea proyectos (la UI oculta el botón “Crear”).
- Sprints:
  - Ve sprints de proyectos donde participa y sprints que lo incluyan en members.
  - No crea/edita sprints.
- Tareas:
  - Ve solo sus tareas.
  - Puede crear tareas (se asignan a sí mismo automáticamente).
  - Puede editar sus propias tareas:
    - Título, estado (Todo/Doing/Done), prioridad, puntos, etiquetas (tags), descripción, fecha (dueDate).
    - No puede cambiar el assignee ni editar tareas de otros.
- Kanban:
  - Puede mover el estado de sus propias tareas (drag & drop persistente).
- Calendario:
  - Ve sus tareas y eventos de proyectos/sprints donde participa (sin “Asignado: Nombre”).
- Archivos:
  - Subir/listar/eliminar archivos en proyectos donde participa.
- Metas (Goals):
  - Puede crear metas propias en proyectos donde participa; ve sus metas.

## Licencia
Uso educativo/demostrativo.
