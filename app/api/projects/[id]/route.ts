import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Project } from "@/models/Project";
import { User } from "@/models/User";
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

  const owner = await User.findById(String(doc.ownerId), { name: 1, email: 1 }).lean();

  return NextResponse.json(
    {
      project: {
        id: (doc as any)._id.toString(),
        name: doc.name,
        key: doc.key,
        ownerId: doc.ownerId,
        ownerName: (owner as any)?.name,
        ownerEmail: (owner as any)?.email,
        members: doc.members ?? [],
        createdAt: (doc as any)?.createdAt?.toISOString?.() ?? new Date((doc as any)?.createdAt).toISOString(),
        dueDate: (doc as any)?.dueDate ? new Date((doc as any)?.dueDate).toISOString() : undefined,
        completed: typeof (doc as any)?.completed === "boolean" ? (((doc as any).completed as boolean)) : false,
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

    // Si intenta cambiar completed, exigir rol manager|admin (owner-scope ya se valida en el filtro de update)
    if (typeof patch.completed === "boolean") {
      if (user.role !== "manager" && user.role !== "admin") {
        return NextResponse.json({ message: "No autorizado" }, { status: 403 });
      }
    }

    const allowed: Record<string, any> = {};
    if (typeof patch.name === "string") {
      allowed.name = patch.name.trim();
    }
    if (typeof patch.key === "string") {
      allowed.key = String(patch.key).toUpperCase();
    }
    if (Array.isArray(patch.members)) {
      // Sanitizar miembros:
      // - Manager: solo developers de su mismo dominio
      // - Admin: cualquier developer
      // - Developer: ignora intento de cambiar miembros
      if (user.role === "manager" || user.role === "admin") {
        const rawMembers = Array.isArray(patch.members) ? (patch.members as any[]).map((m: any) => String(m)) : [];
        const unique: string[] = Array.from(new Set<string>(rawMembers));
        const allowedMembers: string[] = [];
        for (const uid of unique) {
          try {
            const ok = await isAssignableDeveloperForManager(user as any, String(uid));
            if (ok) allowedMembers.push(String(uid));
          } catch {
            // ignorar ids inválidos
          }
        }
        allowed.members = allowedMembers;
      }
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
    if (typeof patch.completed === "boolean") {
      allowed.completed = patch.completed;
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
          completed: typeof (updated as any)?.completed === "boolean" ? (((updated as any).completed as boolean)) : false,
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
