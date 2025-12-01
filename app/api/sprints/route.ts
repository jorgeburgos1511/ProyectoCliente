import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Sprint } from "@/models/Sprint";
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

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId") ?? undefined;

  const filter: Record<string, any> = {};
  if (projectId) filter.projectId = projectId;

  const docs = await Sprint.find(filter).sort({ startDate: -1 });

  const sprints = docs.map((d: any) => ({
    id: d._id.toString(),
    projectId: d.projectId as string,
    name: d.name as string,
    startDate: d.startDate ? new Date(d.startDate).toISOString() : undefined,
    endDate: d.endDate ? new Date(d.endDate).toISOString() : undefined,
    goal: typeof d.goal === "string" ? (d.goal as string) : undefined,
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
    const { projectId, name, startDate, endDate, goal } = body ?? {};

    if (!projectId || !name || !startDate || !endDate) {
      return NextResponse.json(
        { message: "Faltan campos requeridos (projectId, name, startDate, endDate)" },
        { status: 400 }
      );
    }

    const doc = await Sprint.create({
      projectId: String(projectId),
      name: String(name).trim(),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      goal: typeof goal === "string" ? goal : undefined,
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
