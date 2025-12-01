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

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const { id } = await params;

  const doc = await Sprint.findById(id);
  if (!doc) {
    return NextResponse.json({ message: "Sprint no encontrado" }, { status: 404 });
  }

  return NextResponse.json(
    {
      sprint: {
        id: (doc as any)._id.toString(),
        projectId: doc.projectId as string,
        name: doc.name as string,
        startDate: doc.startDate ? new Date(doc.startDate).toISOString() : undefined,
        endDate: doc.endDate ? new Date(doc.endDate).toISOString() : undefined,
        goal: typeof doc.goal === "string" ? (doc.goal as string) : undefined,
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
    if (typeof patch.projectId === "string") allowed.projectId = patch.projectId;
    if (typeof patch.name === "string") allowed.name = patch.name.trim();
    if (typeof patch.startDate === "string") allowed.startDate = new Date(patch.startDate);
    if (typeof patch.endDate === "string") allowed.endDate = new Date(patch.endDate);
    if (typeof patch.goal === "string") allowed.goal = patch.goal;

    const updated = await Sprint.findByIdAndUpdate(id, allowed, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return NextResponse.json({ message: "Sprint no encontrado" }, { status: 404 });
    }

    return NextResponse.json(
      {
        sprint: {
          id: (updated as any)._id.toString(),
          projectId: updated.projectId,
          name: updated.name,
          startDate: updated.startDate ? new Date(updated.startDate).toISOString() : undefined,
          endDate: updated.endDate ? new Date(updated.endDate).toISOString() : undefined,
          goal: updated.goal,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error actualizando sprint:", err);
    return NextResponse.json(
      { message: "Error interno al actualizar sprint" },
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
    const deleted = await Sprint.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ message: "Sprint no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("Error eliminando sprint:", err);
    return NextResponse.json(
      { message: "Error interno al eliminar sprint" },
      { status: 500 }
    );
  }
}
