import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Project } from "@/models/Project";
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

// GET: obtener un proyecto
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();

  const user = requireAuth(req);
  if (!user) {
    return NextResponse.json(
      { message: "No autorizado" },
      { status: 401 }
    );
  }

  const { id } = await params;

  const doc = await Project.findById(id);
  if (!doc || String(doc.ownerId) !== user.sub) {
    return NextResponse.json(
      { message: "Proyecto no encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json(
    {
      project: {
        id: (doc as any)._id.toString(),
        name: doc.name,
        key: doc.key,
        ownerId: doc.ownerId,
        members: doc.members ?? [],
        createdAt: (doc as any)?.createdAt?.toISOString?.() ?? new Date((doc as any)?.createdAt).toISOString(),
        dueDate: (doc as any)?.dueDate ? new Date((doc as any)?.dueDate).toISOString() : undefined,
      },
    },
    { status: 200 }
  );
}

// PUT: editar un proyecto 
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();

  const user = requireAuth(req);
  if (!user) {
    return NextResponse.json(
      { message: "No autorizado" },
      { status: 401 }
    );
  }

  const { id } = await params; 

  try {
    const patch = await req.json();

    const allowed: Record<string, any> = {};
    if (typeof patch.name === "string") {
      allowed.name = patch.name.trim();
    }
    if (typeof patch.key === "string") {
      allowed.key = String(patch.key).toUpperCase();
    }
    if (Array.isArray(patch.members)) {
      allowed.members = patch.members.map(String);
    }

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

    const updated = await Project.findOneAndUpdate(
      { _id: id, ownerId: user.sub },
      allowed,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updated) {
      return NextResponse.json(
        { message: "Proyecto no encontrado" },
        { status: 404 }
      );
    }

    try {
      const io = getIO();
      io.emit("activity:new", {
        userId: user.sub,
        msg: `Project updated: ${String(updated.name)} [${String(
          updated.key
        )}]`,
        ts: Date.now(),
      });
    } catch (e) {
      console.error("socket emit error (project:updated):", e);
    }

    return NextResponse.json(
      {
        project: {
          id: (updated as any)._id.toString(),
          name: updated.name,
          key: updated.key,
          ownerId: updated.ownerId,
          members: updated.members ?? [],
          createdAt: (updated as any)?.createdAt?.toISOString?.() ?? new Date((updated as any)?.createdAt).toISOString(),
          dueDate: (updated as any)?.dueDate ? new Date((updated as any)?.dueDate).toISOString() : undefined,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error actualizando proyecto:", err);
    return NextResponse.json(
      { message: "Error interno al actualizar proyecto" },
      { status: 500 }
    );
  }
}

// DELETE: eliminar un proyecto 
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();

  const user = requireAuth(req);
  if (!user) {
    return NextResponse.json(
      { message: "No autorizado" },
      { status: 401 }
    );
  }

  const { id } = await params; 

  try {
    const deleted = await Project.findOneAndDelete({ _id: id, ownerId: user.sub });

    if (!deleted) {
      return NextResponse.json(
        { message: "Proyecto no encontrado" },
        { status: 404 }
      );
    }

    // notificación por sockets
    try {
      const io = getIO();
      io.emit("activity:new", {
        userId: user.sub,
        msg: `Project deleted: ${String(
          (deleted as any)?.name || ""
        )} [${String((deleted as any)?.key || "")}]`,
        ts: Date.now(),
      });
    } catch (e) {
      console.error("socket emit error (project:deleted):", e);
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("Error eliminando proyecto:", err);
    return NextResponse.json(
      { message: "Error interno al eliminar proyecto" },
      { status: 500 }
    );
  }
}
