import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyUserToken } from "@/lib/jwt";
import { participatesInProject } from "@/lib/permissions";
import { FileModel } from "@/models/File";
import { deleteFromS3 } from "@/lib/s3";

export const runtime = "nodejs";

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

// DELETE /api/files/[id]?projectId=...
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
    const { searchParams } = new URL(req.url);
    const qpProjectId = searchParams.get("projectId") ?? undefined;

    const doc = await FileModel.findById(id).lean();
    if (!doc) {
      return NextResponse.json({ message: "Archivo no encontrado" }, { status: 404 });
    }

    const projectId = String(qpProjectId ?? doc.projectId);
    const canDelete = await participatesInProject(user.sub, projectId);
    if (!canDelete) {
      return NextResponse.json({ message: "Proyecto no accesible" }, { status: 403 });
    }

    // Intentar eliminar de S3 (si falla, no bloquear el borrado del registro)
    try {
      if (doc.key) {
        await deleteFromS3(String(doc.key));
      }
    } catch (e) {
      console.error("S3 delete error:", e);
    }

    await FileModel.findByIdAndDelete(id);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("Error eliminando archivo:", err);
    return NextResponse.json({ message: "Error interno al eliminar archivo" }, { status: 500 });
  }
}
