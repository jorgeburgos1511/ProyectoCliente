import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Goal } from "@/models/Goal";
import { verifyUserToken } from "@/lib/jwt";
import { getIO } from "@/lib/socket-server";

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
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();

  const user = requireAuth(req);
  if (!user) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const doc = await Goal.findById(id);
  if (!doc || String(doc.ownerId) !== user.sub) {
    return NextResponse.json({ message: "Meta no encontrada" }, { status: 404 });
  }

  return NextResponse.json(
    {
      goal: {
        id: (doc as any)._id.toString(),
        title: doc.title as string,
        progress: typeof doc.progress === "number" ? (doc.progress as number) : 0,
        projectId: typeof doc.projectId === "string" ? (doc.projectId as string) : undefined,
        ownerId: typeof doc.ownerId === "string" ? (doc.ownerId as string) : undefined,
        dueDate: (doc as any)?.dueDate ? new Date((doc as any)?.dueDate).toISOString() : undefined,
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

    const allowed: Record<string, any> = {};
    if (typeof patch.title === "string") allowed.title = patch.title.trim();
    if (typeof patch.progress === "number") {
      allowed.progress = Math.max(0, Math.min(100, patch.progress));
    }
    if (typeof patch.projectId === "string") allowed.projectId = patch.projectId;
    if (typeof patch.dueDate === "string") {
      let parsed: Date;
      if (/^\d{4}-\d{2}-\d{2}$/.test(patch.dueDate)) {
        const [yy, mm, dd] = patch.dueDate.split("-").map(Number);
        // Normaliza a mediodía UTC para evitar desfases por zona horaria
        parsed = new Date(Date.UTC(yy, (mm as number) - 1, dd as number, 12, 0, 0));
      } else {
        parsed = new Date(patch.dueDate);
      }
      if (isNaN(parsed.getTime())) {
        return NextResponse.json(
          { message: "Fecha de entrega inválida" },
          { status: 400 }
        );
      }
      allowed.dueDate = parsed;
    }

    const updated = await Goal.findOneAndUpdate(
      { _id: id, ownerId: user.sub },
      allowed,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updated) {
      return NextResponse.json({ message: "Meta no encontrada" }, { status: 404 });
    }

    // Realtime: activity feed for goal update
    try {
      const io = getIO();
      io.emit("activity:new", {
        userId: user.sub,
        msg: `Goal updated: ${String(updated.title)}`,
        ts: Date.now(),
      });
    } catch (e) {
      console.error("socket emit error (goal:updated):", e);
    }

    return NextResponse.json(
      {
        goal: {
          id: (updated as any)._id.toString(),
          title: updated.title,
          progress: updated.progress,
          projectId: updated.projectId,
          ownerId: updated.ownerId,
          dueDate: (updated as any)?.dueDate ? new Date((updated as any)?.dueDate).toISOString() : undefined,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error actualizando meta:", err);
    return NextResponse.json(
      { message: "Error interno al actualizar meta" },
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
    const deleted = await Goal.findOneAndDelete({ _id: id, ownerId: user.sub });

    if (!deleted) {
      return NextResponse.json({ message: "Meta no encontrada" }, { status: 404 });
    }

    // Realtime: activity feed for goal delete
    try {
      const io = getIO();
      io.emit("activity:new", {
        userId: user.sub,
        msg: `Goal deleted: ${String((deleted as any)?.title || "")}`,
        ts: Date.now(),
      });
    } catch (e) {
      console.error("socket emit error (goal:deleted):", e);
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("Error eliminando meta:", err);
    return NextResponse.json(
      { message: "Error interno al eliminar meta" },
      { status: 500 }
    );
  }
}
