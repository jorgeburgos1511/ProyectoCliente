import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Task } from "@/models/Task";
import { verifyUserToken } from "@/lib/jwt";
import { getIO } from "@/lib/socket-server";
import { canEditAnyTaskInProject, canEditOwnTask, isAssignableDeveloperForManager } from "@/lib/permissions";

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

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const { id } = await params;

  const doc = await Task.findById(id);
  if (!doc) {
    return NextResponse.json({ message: "Tarea no encontrada" }, { status: 404 });
  }

  return NextResponse.json(
    {
      task: {
        id: (doc as any)._id.toString(),
        projectId: doc.projectId as string,
        title: doc.title as string,
        status: doc.status as "Todo" | "Doing" | "Done",
        priority: doc.priority as "High" | "Medium" | "Low",
        assigneeId: doc.assigneeId as string | undefined,
        dueDate: doc.dueDate ? new Date(doc.dueDate).toISOString() : undefined,
        points: typeof doc.points === "number" ? doc.points : undefined,
        tags: Array.isArray(doc.tags) ? (doc.tags as string[]) : [],
        description: typeof doc.description === "string" ? (doc.description as string) : undefined,
      },
    },
    { status: 200 }
  );
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();

  const user = requireAuth(req);
  if (!user) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const patch = await req.json();

    const existing = await Task.findById(id);
    if (!existing) {
      return NextResponse.json({ message: "Tarea no encontrada" }, { status: 404 });
    }

    const isProjectWideEditor = await canEditAnyTaskInProject(user, String(existing.projectId));
    const isOwnEditor = canEditOwnTask(user, { assigneeId: String(existing.assigneeId ?? "") });

    if (!isProjectWideEditor && !isOwnEditor) {
      return NextResponse.json({ message: "No autorizado" }, { status: 403 });
    }

    const allowed: Record<string, any> = {};
    // Campos comunes
    if (typeof patch.title === "string") allowed.title = patch.title.trim();
    if (typeof patch.status === "string") allowed.status = patch.status;
    if (typeof patch.priority === "string") allowed.priority = patch.priority;
    if (typeof patch.dueDate === "string") allowed.dueDate = new Date(patch.dueDate);
    if (typeof patch.points === "number") allowed.points = patch.points;
    if (typeof patch.description === "string") allowed.description = patch.description;

    // Campos restringidos a manager/admin (owner del proyecto)
    if (isProjectWideEditor) {
      if (Array.isArray(patch.tags)) allowed.tags = patch.tags.map(String);

      if (typeof patch.assigneeId === "string") {
        // manager: solo developers de su dominio; admin: cualquier developer
        const ok = await isAssignableDeveloperForManager(user, String(patch.assigneeId));
        if (!ok) {
          return NextResponse.json({ message: "Assignee no permitido" }, { status: 400 });
        }
        allowed.assigneeId = String(patch.assigneeId);
      }
    } else {
      // Developer (solo su tarea): puede actualizar sus propias etiquetas, pero no puede cambiar el assignee
      if (typeof patch.assigneeId === "string") {
        return NextResponse.json({ message: "Operación no permitida" }, { status: 403 });
      }
      if (Array.isArray(patch.tags)) {
        allowed.tags = patch.tags.map(String);
      }
    }

    const updated = await Task.findByIdAndUpdate(id, allowed, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return NextResponse.json({ message: "Tarea no encontrada" }, { status: 404 });
    }

    // Realtime: broadcast task:updated and activity
    try {
      const io = getIO();
      const payload = {
        id: (updated as any)._id.toString(),
        title: String(updated.title),
        projectId: String(updated.projectId),
      };
      io.to(`project:${payload.projectId}`).emit("task:updated", payload);
      io.emit("activity:new", {
        userId: user.sub,
        msg: `Task updated: ${payload.title}`,
        ts: Date.now(),
      });
    } catch (e) {
      console.error("socket emit error (task:updated):", e);
    }

    return NextResponse.json(
      {
        task: {
          id: (updated as any)._id.toString(),
          projectId: updated.projectId,
          title: updated.title,
          status: updated.status,
          priority: updated.priority,
          assigneeId: updated.assigneeId,
          dueDate: updated.dueDate ? new Date(updated.dueDate).toISOString() : undefined,
          points: updated.points,
          tags: updated.tags ?? [],
          description: updated.description,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error actualizando tarea:", err);
    return NextResponse.json(
      { message: "Error interno al actualizar tarea" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();

  const user = requireAuth(req);
  if (!user) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const deleted = await Task.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ message: "Tarea no encontrada" }, { status: 404 });
    }

    // Realtime: activity feed for task delete
    try {
      const io = getIO();
      io.emit("activity:new", {
        userId: user.sub,
        msg: `Task deleted: ${String((deleted as any)?.title || id)}`,
        ts: Date.now(),
      });
    } catch (e) {
      console.error("socket emit error (task:deleted):", e);
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("Error eliminando tarea:", err);
    return NextResponse.json(
      { message: "Error interno al eliminar tarea" },
      { status: 500 }
    );
  }
}
