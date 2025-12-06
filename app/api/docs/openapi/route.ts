import { NextResponse } from "next/server";

export async function GET() {
  const spec = {
    openapi: "3.0.3",
    info: {
      title: "TaskFlow API",
      version: "1.0.0",
      description:
        "OpenAPI para los endpoints de TaskFlow (auth, admin/users, users públicos, projects, tasks, sprints, goals).",
    },
    servers: [
      { url: "/api", description: "Servidor local (Next API base)" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        Role: { type: "string", enum: ["admin", "manager", "developer"] },
        UserPublic: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            email: { type: "string", format: "email" },
            role: { $ref: "#/components/schemas/Role" },
          },
          required: ["id", "name", "email", "role"],
        },
        AdminUser: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            email: { type: "string", format: "email" },
            role: { $ref: "#/components/schemas/Role" },
            provider: { type: "string", enum: ["credentials", "google"] },
            createdAt: { type: "string", format: "date-time" },
          },
          required: ["id", "name", "email", "role", "provider", "createdAt"],
        },
        Project: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            key: { type: "string" },
            ownerId: { type: "string" },
            members: { type: "array", items: { type: "string" } },
          },
          required: ["id", "name", "key", "ownerId", "members"],
        },
        TaskStatus: { type: "string", enum: ["Todo", "Doing", "Done"] },
        TaskPriority: { type: "string", enum: ["High", "Medium", "Low"] },
        Task: {
          type: "object",
          properties: {
            id: { type: "string" },
            projectId: { type: "string" },
            title: { type: "string" },
            status: { $ref: "#/components/schemas/TaskStatus" },
            priority: { $ref: "#/components/schemas/TaskPriority" },
            assigneeId: { type: "string", nullable: true },
            dueDate: { type: "string", format: "date", nullable: true },
            points: { type: "number", nullable: true },
            tags: { type: "array", items: { type: "string" }, nullable: true },
            description: { type: "string", nullable: true },
          },
          required: ["id", "projectId", "title", "status", "priority"],
        },
        Sprint: {
          type: "object",
          properties: {
            id: { type: "string" },
            projectId: { type: "string" },
            name: { type: "string" },
            startDate: { type: "string", format: "date" },
            endDate: { type: "string", format: "date" },
            goal: { type: "string", nullable: true },
          },
          required: ["id", "projectId", "name", "startDate", "endDate"],
        },
        Goal: {
          type: "object",
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            progress: { type: "number" },
            projectId: { type: "string", nullable: true },
            ownerId: { type: "string", nullable: true },
          },
          required: ["id", "title", "progress"],
        },
        LoginRequest: {
          type: "object",
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string" },
          },
          required: ["email", "password"],
        },
        RegisterRequest: {
          type: "object",
          properties: {
            name: { type: "string" },
            email: { type: "string", format: "email" },
            password: { type: "string" },
          },
          required: ["name", "email", "password"],
        },
        GoogleAuthRequest: {
          type: "object",
          properties: { code: { type: "string" } },
          required: ["code"],
        },
        AuthResponse: {
          type: "object",
          properties: {
            user: { $ref: "#/components/schemas/UserPublic" },
            token: { type: "string" },
          },
          required: ["user", "token"],
        },
        UpdateRoleRequest: {
          type: "object",
          properties: {
            userId: { type: "string" },
            role: { $ref: "#/components/schemas/Role" },
          },
          required: ["userId", "role"],
        },
        CreateProjectRequest: {
          type: "object",
          properties: {
            name: { type: "string" },
            key: { type: "string" },
            ownerId: { type: "string" },
            members: { type: "array", items: { type: "string" } },
          },
          required: ["name", "key", "ownerId"],
        },
        UpdateProjectRequest: {
          type: "object",
          properties: {
            name: { type: "string" },
            key: { type: "string" },
            ownerId: { type: "string" },
            members: { type: "array", items: { type: "string" } },
          },
        },
        CreateTaskRequest: {
          type: "object",
          properties: {
            projectId: { type: "string" },
            title: { type: "string" },
            status: { $ref: "#/components/schemas/TaskStatus" },
            priority: { $ref: "#/components/schemas/TaskPriority" },
            assigneeId: { type: "string" },
            dueDate: { type: "string", format: "date" },
            points: { type: "number" },
            tags: { type: "array", items: { type: "string" } },
            description: { type: "string" },
          },
          required: ["projectId", "title"],
        },
        UpdateTaskRequest: { $ref: "#/components/schemas/CreateTaskRequest" },
        CreateSprintRequest: {
          type: "object",
          properties: {
            projectId: { type: "string" },
            name: { type: "string" },
            startDate: { type: "string", format: "date" },
            endDate: { type: "string", format: "date" },
            goal: { type: "string" },
          },
          required: ["projectId", "name", "startDate", "endDate"],
        },
        UpdateSprintRequest: { $ref: "#/components/schemas/CreateSprintRequest" },
        CreateGoalRequest: {
          type: "object",
          properties: {
            title: { type: "string" },
            progress: { type: "number" },
            projectId: { type: "string" },
            ownerId: { type: "string" },
          },
          required: ["title"],
        },
        UpdateGoalRequest: { $ref: "#/components/schemas/CreateGoalRequest" },
        ErrorResponse: {
          type: "object",
          properties: {
            message: { type: "string" },
          },
          required: ["message"],
        },
      },
    },
    paths: {
      "/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Login con credenciales",
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/LoginRequest" } },
            },
          },
          responses: {
            "200": { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } } },
            "400": { description: "Bad Request", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            "401": { description: "Unauthorized" },
          },
        },
      },
      "/auth/register": {
        post: {
          tags: ["Auth"],
          summary: "Registro de usuario",
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/RegisterRequest" } },
            },
          },
          responses: {
            "201": { description: "Created", content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } } },
            "400": { description: "Bad Request" },
            "409": { description: "Conflict" },
          },
        },
      },
      "/auth/google": {
        post: {
          tags: ["Auth"],
          summary: "Login con Google (authorization code)",
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/GoogleAuthRequest" } },
            },
          },
          responses: {
            "200": { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } } },
            "500": { description: "Server Error" },
          },
        },
      },
      "/admin": {
        get: {
          tags: ["Admin"],
          summary: "Listar usuarios (admin)",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": {
              description: "OK",
              content: {
                "application/json": { schema: { type: "object", properties: { users: { type: "array", items: { $ref: "#/components/schemas/AdminUser" } } } } },
              },
            },
            "401": { description: "Unauthorized" },
          },
        },
        put: {
          tags: ["Admin"],
          summary: "Actualizar rol de usuario (admin)",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/UpdateRoleRequest" } },
            },
          },
          responses: {
            "200": { description: "OK" },
            "400": { description: "Bad Request" },
            "401": { description: "Unauthorized" },
            "404": { description: "Not Found" },
          },
        },
      },
      "/users": {
        get: {
          tags: ["Users"],
          summary: "Listar usuarios públicos (campos seguros)",
          responses: {
            "200": {
              description: "OK",
              content: {
                "application/json": { schema: { type: "object", properties: { users: { type: "array", items: { $ref: "#/components/schemas/UserPublic" } } } } },
              },
            },
          },
        },
      },
      "/projects": {
        get: {
          tags: ["Projects"],
          summary: "Listar proyectos",
          responses: {
            "200": {
              description: "OK",
              content: {
                "application/json": { schema: { type: "object", properties: { projects: { type: "array", items: { $ref: "#/components/schemas/Project" } } } } },
              },
            },
          },
        },
        post: {
          tags: ["Projects"],
          summary: "Crear proyecto",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/CreateProjectRequest" } },
            },
          },
          responses: {
            "201": { description: "Created", content: { "application/json": { schema: { type: "object", properties: { project: { $ref: "#/components/schemas/Project" } } } } } },
            "400": { description: "Bad Request" },
            "401": { description: "Unauthorized" },
          },
        },
      },
      "/projects/{id}": {
        get: {
          tags: ["Projects"],
          summary: "Obtener proyecto por id",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "OK", content: { "application/json": { schema: { type: "object", properties: { project: { $ref: "#/components/schemas/Project" } } } } } },
            "404": { description: "Not Found" },
          },
        },
        put: {
          tags: ["Projects"],
          summary: "Actualizar proyecto",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/UpdateProjectRequest" } },
            },
          },
          responses: {
            "200": { description: "OK" },
            "401": { description: "Unauthorized" },
            "404": { description: "Not Found" },
          },
        },
        delete: {
          tags: ["Projects"],
          summary: "Eliminar proyecto",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "OK" },
            "401": { description: "Unauthorized" },
            "404": { description: "Not Found" },
          },
        },
      },
      "/tasks": {
        get: {
          tags: ["Tasks"],
          summary: "Listar tareas",
          parameters: [
            { name: "projectId", in: "query", schema: { type: "string" } },
            { name: "assigneeId", in: "query", schema: { type: "string" } },
          ],
          responses: {
            "200": {
              description: "OK",
              content: {
                "application/json": { schema: { type: "object", properties: { tasks: { type: "array", items: { $ref: "#/components/schemas/Task" } } } } },
              },
            },
          },
        },
        post: {
          tags: ["Tasks"],
          summary: "Crear tarea",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/CreateTaskRequest" } },
            },
          },
          responses: {
            "201": { description: "Created" },
            "400": { description: "Bad Request" },
            "401": { description: "Unauthorized" },
          },
        },
      },
      "/tasks/{id}": {
        get: {
          tags: ["Tasks"],
          summary: "Obtener tarea",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "OK" },
            "404": { description: "Not Found" },
          },
        },
        put: {
          tags: ["Tasks"],
          summary: "Actualizar tarea",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/UpdateTaskRequest" } },
            },
          },
          responses: {
            "200": { description: "OK" },
            "401": { description: "Unauthorized" },
            "404": { description: "Not Found" },
          },
        },
        delete: {
          tags: ["Tasks"],
          summary: "Eliminar tarea",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "OK" },
            "401": { description: "Unauthorized" },
            "404": { description: "Not Found" },
          },
        },
      },
      "/sprints": {
        get: {
          tags: ["Sprints"],
          summary: "Listar sprints",
          parameters: [{ name: "projectId", in: "query", schema: { type: "string" } }],
          responses: {
            "200": {
              description: "OK",
              content: {
                "application/json": { schema: { type: "object", properties: { sprints: { type: "array", items: { $ref: "#/components/schemas/Sprint" } } } } },
              },
            },
          },
        },
        post: {
          tags: ["Sprints"],
          summary: "Crear sprint",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/CreateSprintRequest" } },
            },
          },
          responses: {
            "201": { description: "Created" },
            "400": { description: "Bad Request" },
            "401": { description: "Unauthorized" },
          },
        },
      },
      "/sprints/{id}": {
        get: {
          tags: ["Sprints"],
          summary: "Obtener sprint",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "OK" },
            "404": { description: "Not Found" },
          },
        },
        put: {
          tags: ["Sprints"],
          summary: "Actualizar sprint",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/UpdateSprintRequest" } },
            },
          },
          responses: {
            "200": { description: "OK" },
            "401": { description: "Unauthorized" },
            "404": { description: "Not Found" },
          },
        },
        delete: {
          tags: ["Sprints"],
          summary: "Eliminar sprint",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "OK" },
            "401": { description: "Unauthorized" },
            "404": { description: "Not Found" },
          },
        },
      },
      "/goals": {
        get: {
          tags: ["Goals"],
          summary: "Listar metas",
          parameters: [{ name: "projectId", in: "query", schema: { type: "string" } }],
          responses: {
            "200": {
              description: "OK",
              content: {
                "application/json": { schema: { type: "object", properties: { goals: { type: "array", items: { $ref: "#/components/schemas/Goal" } } } } },
              },
            },
          },
        },
        post: {
          tags: ["Goals"],
          summary: "Crear meta",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/CreateGoalRequest" } },
            },
          },
          responses: {
            "201": { description: "Created" },
            "400": { description: "Bad Request" },
            "401": { description: "Unauthorized" },
          },
        },
      },
      "/goals/{id}": {
        get: {
          tags: ["Goals"],
          summary: "Obtener meta",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "OK" },
            "404": { description: "Not Found" },
          },
        },
        put: {
          tags: ["Goals"],
          summary: "Actualizar meta",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/UpdateGoalRequest" } },
            },
          },
          responses: {
            "200": { description: "OK" },
            "401": { description: "Unauthorized" },
            "404": { description: "Not Found" },
          },
        },
        delete: {
          tags: ["Goals"],
          summary: "Eliminar meta",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "OK" },
            "401": { description: "Unauthorized" },
            "404": { description: "Not Found" },
          },
        },
      },
    },
  };

  return NextResponse.json(spec, { status: 200 });
}
