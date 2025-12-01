# TaskFlow UI + API (Next.js 16, TypeScript, Mongo, Socket.IO)

Aplicación full‑stack basada en Next.js (App Router) con UI en React y API integrada. Incluye persistencia real con MongoDB/Mongoose, autenticación JWT, control de acceso por propietario (owner), documentación OpenAPI y soporte de tiempo real con Socket.IO. La UI ha sido simplificada para mostrar únicamente funcionalidades reales.

Tabla de contenidos
- Introducción
- Características principales
- Arquitectura y estructura
- Modelado de datos (Mongoose)
- Autenticación y autorización
- Endpoints (resumen)
- Cliente (servicios y UI)
- Calendario (dueDate)
- Tiempo real (Socket.IO)
- Variables de entorno
- Instalación, ejecución y scripts
- Pruebas (unitarias y E2E)
- Seguridad y buenas prácticas
- Roadmap y limitaciones
- Licencia

Introducción
TaskFlow-Cliente es un proyecto educativo/demostrativo que integra:
- Frontend en Next.js 16 (App Router) + React 19 + TypeScript + Tailwind v4 + shadcn/ui.
- Backend API en los propios route handlers de Next (app/api/**).
- Persistencia con MongoDB/Mongoose.
- Autenticación con JWT y control de acceso por propietario (owner).
- Documentación REST con Swagger UI en /api-docs.
- Socket.IO para demos de tiempo real (servidor activo).

Características principales
- Autenticación por credenciales y Google OAuth (authorization code).
- Proyectos y Metas:
  - CRUD real con control por propietario (owner).
  - Due date (dueDate) en modelo y API.
  - Filtrado por owner en GET y validaciones de acceso en GET/id, PUT, DELETE.
- UI simplificada y enfocada:
  - Dashboard: accesos rápidos, estadísticas y próximas entregas (Proyectos/Metas).
  - Mi trabajo: muestra solamente “Mis proyectos”.
  - Calendario: grilla mensual real con navegación; muestra Proyectos y Metas con dueDate.
  - Perfil: sólo lectura (nombre, correo).
  - Topbar/Sidebar: sin mostrar el rol del usuario.
  - Footer: “© 2025 TaskFlow.”.
  - Vista de sockets: sólo “Socket logs” y “Actividad en tiempo real”.
- Documentación OpenAPI interactiva en /api-docs.
- Pruebas unitarias (Vitest) y E2E (Cypress).

Arquitectura y estructura
Raíz
- app/ App Router (páginas Server/Client + API)
- components/ Componentes UI (shadcn/ui, layout, tablas, formularios)
- lib/ Utilidades (db, jwt, roles, socket server/client, s3, utils)
- models/ Modelos Mongoose
- services/ Servicios de cliente (fetch)
- hooks/ Hooks (useSocket, etc.)
- cypress/, test/ Pruebas E2E y unitarias
- docs/ Documentación adicional

Rutas UI (extracto)
- /login, /register
- /(app)/dashboard
- /(app)/projects, /(app)/projects/[id]/*
- /(app)/goals
- /(app)/my-work
- /(app)/calendar
- /(app)/profile
- /(app)/admin/users (solo admin)
- /socket-demo (vista simplificada: logs y actividad RT)

API (App Router)
- /api/auth/*: register, login, google
- /api/projects, /api/projects/[id], /api/projects/[id]/files/*
- /api/goals, /api/goals/[id]
- /api/tasks, /api/tasks/[id]
- /api/sprints, /api/sprints/[id]
- /api/users (público: nombre, email, rol para selects)
- /api/admin (listado y cambio de rol; requiere admin)
- /api/docs/openapi (JSON), /api-docs (UI Swagger)
- /api/socket (warm‑up Socket.IO)

Patrón Server/Client
- Las páginas de App Router usan “Server page + ClientPageClient” cuando aplica.
- Metadatos exportados sólo en componentes de servidor.

Modelado de datos (Mongoose)
User (models/User.ts)
- name: string
- email: string (único, lowercase)
- password?: string
- role: "admin" | "manager" | "developer"
- provider: "credentials" | "google"
- googleId?: string
- avatarUrl?: string
- timestamps

Project (models/Project.ts)
- name: string
- key: string (uppercase, 2..6)
- ownerId: string
- members: string[] (no usado en UI actual; por defecto [])
- dueDate?: Date
- timestamps

Goal (models/Goal.ts)
- title: string
- progress: number (0..100)
- projectId?: string
- ownerId?: string
- dueDate?: Date
- timestamps

Task (models/Task.ts)
- projectId: string
- title: string
- status: "Todo" | "Doing" | "Done"
- priority: "High" | "Medium" | "Low"
- assigneeId?: string
- dueDate?: Date
- points?: number
- tags?: string[]
- description?: string
- timestamps

Sprint (models/Sprint.ts), File (models/File.ts)
- Ver modelos para detalles.

Autenticación y autorización
- JWT firmado con JWT_SECRET; expiración configurable (JWT_EXPIRES_IN).
- Authorization: Bearer <token> en endpoints de escritura y en GET protegidos.
- Control por propietario (owner‑scoped):
  - Projects, Goals:
    - GET: token requerido; lista sólo recursos del owner.
    - GET [id]: 404 si no pertenece al owner.
    - POST: fuerza ownerId = user.sub (se ignora ownerId del body).
    - PUT/DELETE: sólo si ownerId = user.sub.
  - Tasks, Sprints: CRUD real. Owner‑scoped no aplicado aún (mejorable).
- Admin:
  - /api/admin: requiere rol admin para listar usuarios y cambiar rol.

Endpoints (resumen)
Auth
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/google

Projects (owner‑scoped)
- GET /api/projects (token): lista sólo del owner. Devuelve dueDate y createdAt.
- POST /api/projects (token): crea proyecto; dueDate opcional (“YYYY-MM-DD” o ISO).
- GET /api/projects/[id] (token, owner)
- PUT /api/projects/[id] (token, owner): name/key/dueDate; no permite ownerId.
- DELETE /api/projects/[id] (token, owner)
- Files S3:
  - /api/projects/[id]/files
  - /api/projects/[id]/files/[fileId]

Goals (owner‑scoped)
- GET /api/goals (token): opcional projectId; lista sólo del owner.
- POST /api/goals (token): title requerido; dueDate opcional; valida projectId si se envía.
- GET /api/goals/[id] (token, owner)
- PUT /api/goals/[id] (token, owner)
- DELETE /api/goals/[id] (token, owner)

Tasks
- GET/POST /api/tasks?projectId=&assigneeId=
- GET/PUT/DELETE /api/tasks/[id]

Sprints
- GET/POST /api/sprints?projectId=
- GET/PUT/DELETE /api/sprints/[id]

OpenAPI
- GET /api/docs/openapi
- UI: /api-docs

Cliente (servicios y UI)
Servicios cliente (services/api/**)
- auth.service.ts: login/register/google, helpers de token.
- users.service.ts (admin) y users-public.service.ts (listado público).
- projects.service.ts: fetchProjects/fetchProject/create/update/delete (Authorization en GET).
- goals.service.ts: fetchGoals/create/update/delete.
- sprints.service.ts, tasks.service.ts: CRUD.
- mocks en services/mock/** (no usados en UI real actual).

UI (extracto)
- Dashboard: accesos rápidos (Proyectos/Metas/Calendario/Mi trabajo), estadísticas simples y próximas entregas (7 días) de Proyectos/Metas. Sin feed RT.
- Projects:
  - Tabla sin columna “Miembros”.
  - Formulario con name, key, dueDate (owner forzado en backend).
  - Members UI removida (ruta /projects/[id]/members redirige a kanban).
- Goals:
  - Formulario con title, progress, projectId opcional (owner) y dueDate.
- My Work:
  - Listado de “Mis proyectos” (sólo del owner).
- Profile:
  - Sólo lectura (nombre, correo).
- Topbar/Sidebar:
  - Ocultan el rol (“Rol: …”).
- Footer:
  - “© 2025 TaskFlow.”
- Socket demo:
  - Sólo “Socket logs” y “Actividad en tiempo real”.

Calendario (dueDate)
- Grilla mensual real con navegación (Hoy, anterior, siguiente).
- Muestra eventos únicamente si hay dueDate:
  - Proyectos: usa project.dueDate.
  - Metas: usa goal.dueDate.
- Normalizaciones para evitar desfases por zona horaria:
  - Cliente: “YYYY-MM-DD” se trata como fecha local (new Date(yyyy, mm-1, dd)).
  - Servidor: si llega “YYYY-MM-DD”, se guarda como Date.UTC(..., 12:00) para no “cambiar de día” por TZ.

Tiempo real (Socket.IO)
- Servidor dedicado (lib/socket-server.ts) con warm‑up GET /api/socket.
- Autenticación en handshake con JWT; socket.data.user = { id, role }.
- Rooms: project:{id}; eventos activity:* y task:*; presencia por room (mock en memoria).
- CORS en dev: http://localhost:3000; prod configurable.
- Vista “/socket-demo”:
  - Muestra “Socket logs” y “Actividad en tiempo real”.

Variables de entorno (.env)
Server/API
- MONGODB_URI=mongodb://localhost:27017/taskflow
- JWT_SECRET=un_secret_largo_aleatorio
- JWT_EXPIRES_IN=7d
- GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI

Client
- NEXT_PUBLIC_API_URL=http://localhost:3000/api
- NEXT_PUBLIC_GOOGLE_CLIENT_ID=<client_id_publico>

Sockets (opcional)
- SOCKET_PORT=3001
- NEXT_PUBLIC_SOCKET_PORT=3001
- NEXT_PUBLIC_SOCKET_URL=<url completa> (prioritaria)
- NEXT_PUBLIC_SITE_URL (CORS en prod)

S3 (opcional)
- AWS_S3_BUCKET, AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY

Instalación, ejecución y scripts
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

Pruebas
Unitarias (Vitest + Testing Library)
- Entorno happy-dom (config en test/setup.ts).
- Mocks de next/navigation, toast, etc.

E2E (Cypress)
- BaseUrl http://localhost:3000
- Especificaciones de autenticación y navegación a Proyectos.
- Nota: Especificaciones relacionadas con “Miembros” pueden requerir actualización debido a la UI actual.

Seguridad y buenas prácticas
- Token almacenado en localStorage por compatibilidad; recomendado migrar a cookie httpOnly + SameSite (+ CSRF si se usa cookie en escrituras).
- GET de Proyectos/Metas requieren token y se filtran por owner para evitar exposición de datos.
- Sockets: validar JWT en handshake; limitar CORS en producción; considerar rate limiting y logs.
- S3: validar size/content-type/keys; evitar datos sensibles en payloads.

Roadmap y limitaciones
- Owner‑scoped para Tasks/Sprints (replicar patrón de Projects/Goals).
- Kanban sigue mock visual (sin persistencia de drag).
- Presencia RT en memoria (mock), no apto multi‑instancia (necesitaría store).
- Agregar .env.example y script de seed (fixtures).
- Endpoint /api/auth/me + rehidratación en AuthProvider.
- Validaciones Zod en handlers API para estandarizar errores.
- Más pruebas de API (contract) y E2E de flujos completos.

Licencia
Uso educativo/demostrativo.
