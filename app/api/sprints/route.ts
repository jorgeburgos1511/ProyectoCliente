import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Sprint } from "@/models/Sprint";
import { Project } from "@/models/Project";
import { verifyUserToken } from "@/lib/jwt";

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

// GET /api/sprints?projectId=...
export async function GET(req: Request) {
  await connectDB();

  // Requerir auth para owner-scope
  const user = requireAuth(req);
  if (!user) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId") ?? undefined;

  // Proyectos en los que el usuario participa (owner o miembro)
  const projDocs = await Project.find({
    $or: [{ ownerId: user.sub }, { members: user.sub }],
  }).select({ _id: 1 });
  const allowedIds = new Set(projDocs.map((p: any) => String(p._id)));

  // Sprints visibles si:
  // - pertenecen a un proyecto donde el usuario es owner/miembro, o
  // - el sprint contiene al usuario en members
  const filter: Record<string, any> = {};
  if (projectId) {
    filter.$or = [{ projectId: String(projectId) }, { members: user.sub }];
  } else {
    filter.$or = [{ projectId: { $in: Array.from(allowedIds) } }, { members: user.sub }];
  }

  const docs = await Sprint.find(filter).sort({ startDate: -1 });

  const sprints = docs.map((d: any) => ({
    id: d._id.toString(),
    projectId: d.projectId as string,
    name: d.name as string,
    startDate: d.startDate ? new Date(d.startDate).toISOString() : undefined,
    endDate: d.endDate ? new Date(d.endDate).toISOString() : undefined,
    goal: typeof d.goal === "string" ? (d.goal as string) : undefined,
    completed: typeof d.completed === "boolean" ? (d.completed as boolean) : false,
    members: Array.isArray(d.members) ? (d.members as string[]) : [],
  }));

  return NextResponse.json({ sprints }, { status: 200 });
}

// POST /api/sprints
export async function POST(req: Request) {
  await connectDB();

  const user = requireAuth(req);
  if (!user) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { projectId, name, startDate, endDate, goal, completed } = body ?? {};

    if (!projectId || !name || !startDate || !endDate) {
      return NextResponse.json(
        { message: "Faltan campos requeridos (projectId, name, startDate, endDate)" },
        { status: 400 }
      );
    }

    // Requiere rol manager|admin
    if (user.role !== "manager" && user.role !== "admin") {
      return NextResponse.json({ message: "No autorizado" }, { status: 403 });
    }

    // Validar que el proyecto pertenezca al owner
    const proj = await Project.findOne({ _id: String(projectId), ownerId: user.sub });
    if (!proj) {
      return NextResponse.json({ message: "Proyecto no accesible" }, { status: 403 });
    }

    const doc = await Sprint.create({
      projectId: String(projectId),
      name: String(name).trim(),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      goal: typeof goal === "string" ? goal : undefined,
      completed: typeof completed === "boolean" ? completed : false,
      members: Array.isArray((proj as any).members) ? (((proj as any).members as string[])) : [],
    });

    return NextResponse.json(
      {
        sprint: {
          id: (doc as any)._id.toString(),
          projectId: doc.projectId,
          name: doc.name,
          startDate: doc.startDate ? new Date(doc.startDate).toISOString() : undefined,
          endDate: doc.endDate ? new Date(doc.endDate).toISOString() : undefined,
          goal: doc.goal,
          completed: typeof (doc as any).completed === "boolean" ? ((doc as any).completed as boolean) : false,
          members: Array.isArray((doc as any).members) ? (((doc as any).members as string[])) : [],
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error creando sprint:", err);
    return NextResponse.json(
      { message: "Error interno al crear sprint" },
      { status: 500 }
    );
  }
}
