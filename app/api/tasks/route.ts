import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Task } from "@/models/Task";
import { Project } from "@/models/Project";
import { verifyUserToken } from "@/lib/jwt";
import { getIO } from "@/lib/socket-server";
import { isAssignableDeveloperForManager } from "@/lib/permissions";

type JwtPayload = {
  sub: string;
  email: string;
  role: "admin" | "manager" | "developer";
  iat: number;
  exp: number;
};

function requireAuth(req: Request): JwtPayload | null {
  const auth = req.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;
  const token = auth.slice("Bearer ".length);
  try {
    return verifyUserToken(token) as JwtPayload;
  } catch {
    return null;
  }
}

// GET /api/tasks?projectId=...&assigneeId=...
export async function GET(req: Request) {
  await connectDB();

  const user = requireAuth(req);
  if (!user) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId") ?? undefined;

  let filter: Record<string, any> = {};
  if (user.role === "manager" || user.role === "admin") {
    // Tareas de proyectos del owner (manager/admin) + opcionalmente propias
    const owned = await Project.find({ ownerId: user.sub }).select({ _id: 1 }).lean();
    const ownedIds = new Set(owned.map((p: any) => String(p._id)));
    if (projectId) {
      // restringir al project solicitado si es del owner; si no, devolver vacío
      if (ownedIds.has(String(projectId))) {
        filter.projectId = String(projectId);
      } else {
        // aún así, permitir ver sus propias tareas en ese proyecto si existieran (seguridad conservadora)
        filter = { projectId: String(projectId), assigneeId: user.sub };
      }
    } else {
      filter = { $or: [{ projectId: { $in: Array.from(ownedIds) } }, { assigneeId: user.sub }] };
    }
  } else {
    // Developer: solo sus tareas
    filter = { assigneeId: user.sub };
    if (projectId) filter.projectId = projectId;
  }

  const docs = await Task.find(filter).sort({ createdAt: -1 });

  const tasks = docs.map((d: any) => ({
    id: d._id.toString(),
    projectId: d.projectId as string,
    title: d.title as string,
    status: d.status as "Todo" | "Doing" | "Done",
    priority: d.priority as "High" | "Medium" | "Low",
    assigneeId: d.assigneeId as string | undefined,
    dueDate: d.dueDate ? new Date(d.dueDate).toISOString() : undefined,
    points: typeof d.points === "number" ? d.points : undefined,
    tags: Array.isArray(d.tags) ? (d.tags as string[]) : [],
    description: typeof d.description === "string" ? (d.description as string) : undefined,
  }));

  return NextResponse.json({ tasks }, { status: 200 });
}

// POST /api/tasks
export async function POST(req: Request) {
  await connectDB();

  const user = requireAuth(req);
  if (!user) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      projectId,
      title,
      status,
      priority,
      assigneeId,
      dueDate,
      points,
      tags,
      description,
    } = body ?? {};

    if (!projectId || !title) {
      return NextResponse.json(
        { message: "Faltan campos requeridos (projectId, title)" },
        { status: 400 }
      );
    }

    const allowedStatuses = new Set(["Todo", "Doing", "Done"]);
    const allowedPriorities = new Set(["High", "Medium", "Low"]);

    // Determinar asignación:
    // - Developer: siempre a sí mismo (user.sub)
    // - Manager: puede asignar solo a developers de su mismo dominio
    // - Admin: puede asignar a cualquier developer
    let finalAssigneeId: string = user.sub;
    if (typeof assigneeId === "string" && (user.role === "manager" || user.role === "admin")) {
      try {
        const ok = await isAssignableDeveloperForManager(user, String(assigneeId));
        if (ok) {
          finalAssigneeId = String(assigneeId);
        }
      } catch {
        // Silenciar y dejar asignación por defecto (self)
      }
    }

    // Asignación controlada según rol (ver lógica arriba)
    const doc = await Task.create({
      projectId: String(projectId),
      title: String(title).trim(),
      status: allowedStatuses.has(status) ? status : "Todo",
      priority: allowedPriorities.has(priority) ? priority : "Medium",
      assigneeId: finalAssigneeId,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      points: typeof points === "number" ? points : undefined,
      tags: Array.isArray(tags) ? tags.map(String) : [],
      description: typeof description === "string" ? description : undefined,
    });

    // Realtime: broadcast task:created and activity
    try {
      const io = getIO();
      const payload = {
        id: (doc as any)._id.toString(),
        title: String(doc.title),
        projectId: String(doc.projectId),
      };
      io.to(`project:${payload.projectId}`).emit("task:created", payload);
      io.emit("activity:new", {
        userId: user.sub,
        msg: `Task created: ${payload.title}`,
        ts: Date.now(),
      });
    } catch (e) {
      console.error("socket emit error (task:created):", e);
    }

    return NextResponse.json(
      {
        task: {
          id: (doc as any)._id.toString(),
          projectId: doc.projectId,
          title: doc.title,
          status: doc.status,
          priority: doc.priority,
          assigneeId: doc.assigneeId,
          dueDate: doc.dueDate ? new Date(doc.dueDate).toISOString() : undefined,
          points: doc.points,
          tags: doc.tags ?? [],
          description: doc.description,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error creando tarea:", err);
    return NextResponse.json(
      { message: "Error interno al crear tarea" },
      { status: 500 }
    );
  }
}
