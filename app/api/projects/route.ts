import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Project } from "@/models/Project";
import { User } from "@/models/User";
import { Sprint } from "@/models/Sprint";
import { Task } from "@/models/Task";
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

export async function GET(req: Request) {
  await connectDB();

  const user = requireAuth(req);
  if (!user) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  // Mostrar proyectos según rol:
  // - developer: proyectos donde es miembro, o donde participa por sprint.members o tasks.assigneeId
  // - admin/manager: owner o miembro
  let filter: Record<string, any> = {};
  if (user.role === "developer") {
    const sprintProjIds = await Sprint.find({ members: user.sub }).distinct("projectId");
    const taskProjIds = await Task.find({ assigneeId: user.sub }).distinct("projectId");
    const extraIds = Array.from(new Set<string>([...sprintProjIds.map(String), ...taskProjIds.map(String)]));
    filter = { $or: [{ members: user.sub }, { _id: { $in: extraIds } }] };
  } else {
    filter = { $or: [{ ownerId: user.sub }, { members: user.sub }] };
  }
  const docs = await Project.find(filter).sort({ createdAt: -1 });

  // Pre-cargar nombres de owners para mostrar en tabla
  const ownerIds = Array.from(new Set(docs.map((d: any) => String(d.ownerId))));
  const owners = ownerIds.length
    ? await User.find({ _id: { $in: ownerIds } }, { name: 1, email: 1 }).lean()
    : [];
  const ownerMap = new Map(
    owners.map((o: any) => [String(o._id), { name: o.name as string, email: o.email as string }])
  );

  const projects = docs.map((d: any) => {
    const owner = ownerMap.get(String(d.ownerId)) ?? null;
    return {
      id: d._id.toString(),
      name: d.name as string,
      key: d.key as string,
      ownerId: d.ownerId as string,
      ownerName: owner?.name,
      ownerEmail: owner?.email,
      members: (d.members ?? []) as string[],
      createdAt: d.createdAt?.toISOString?.() ?? new Date(d.createdAt).toISOString(),
      dueDate: d.dueDate ? new Date(d.dueDate as any).toISOString() : undefined,
      completed: typeof d.completed === "boolean" ? (d.completed as boolean) : false,
    };
  });

  return NextResponse.json({ projects }, { status: 200 });
}

export async function POST(req: Request) {
  await connectDB();

  const user = requireAuth(req);
  if (!user) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const { name, key, members, dueDate } = await req.json();

    if (!name || !key) {
      return NextResponse.json(
        { message: "Faltan campos requeridos (name, key)" },
        { status: 400 }
      );
    }

    let due: Date | undefined;
    if (dueDate) {
      let parsed: Date;
      if (typeof dueDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
        const [yy, mm, dd] = dueDate.split("-").map(Number);
        // Guardar como fecha "neutra" al mediodía UTC para evitar desfases por zona horaria
        parsed = new Date(Date.UTC(yy, (mm as number) - 1, dd as number, 12, 0, 0));
      } else {
        parsed = new Date(dueDate);
      }
      if (isNaN(parsed.getTime())) {
        return NextResponse.json(
          { message: "Fecha de entrega inválida" },
          { status: 400 }
        );
      }
      due = parsed;
    }

    // Sanitizar miembros del proyecto según rol:
    // - Manager: solo developers de su mismo dominio
    // - Admin: cualquier developer
    // - Developer: no puede establecer miembros
    let sanitizedMembers: string[] = [];
    if (Array.isArray(members) && (user.role === "manager" || user.role === "admin")) {
      const unique = Array.from(new Set(members.map((m: any) => String(m))));
      const allowed: string[] = [];
      for (const uid of unique) {
        try {
          const ok = await isAssignableDeveloperForManager(user as any, uid);
          if (ok) allowed.push(uid);
        } catch {
          // ignorar ids inválidos
        }
      }
      sanitizedMembers = allowed;
    }

    const created = await Project.create({
      name: String(name).trim(),
      key: String(key).toUpperCase(),
      ownerId: user.sub,
      members: sanitizedMembers,
      dueDate: due,
    });

    try {
      const io = getIO();
      io.emit("activity:new", {
        userId: user.sub,
        msg: `Project created: ${String(created.name)} [${String(created.key)}]`,
        ts: Date.now(),
      });
    } catch (e) {
      console.error("socket emit error (project:created):", e);
    }

    return NextResponse.json(
      {
        project: {
          id: (created as any)._id.toString(),
          name: created.name,
          key: created.key,
          ownerId: created.ownerId,
          members: created.members ?? [],
          createdAt: created.createdAt?.toISOString?.() ?? new Date(created.createdAt as any).toISOString(),
          dueDate: created.dueDate ? new Date(created.dueDate as any).toISOString() : undefined,
          completed: typeof (created as any).completed === "boolean" ? ((created as any).completed as boolean) : false,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error creando proyecto:", err);
    return NextResponse.json(
      { message: "Error interno al crear proyecto" },
      { status: 500 }
    );
  }
}
