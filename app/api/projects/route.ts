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

export async function GET(req: Request) {
  await connectDB();

  const user = requireAuth(req);
  if (!user) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const docs = await Project.find({ ownerId: user.sub }).sort({ createdAt: -1 });
  const projects = docs.map((d: any) => ({
    id: d._id.toString(),
    name: d.name as string,
    key: d.key as string,
    ownerId: d.ownerId as string,
    members: (d.members ?? []) as string[],
    createdAt: d.createdAt?.toISOString?.() ?? new Date(d.createdAt).toISOString(),
    dueDate: d.dueDate ? new Date(d.dueDate as any).toISOString() : undefined,
  }));

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

    const created = await Project.create({
      name: String(name).trim(),
      key: String(key).toUpperCase(),
      ownerId: user.sub,
      members: Array.isArray(members) ? members.map(String) : [],
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
