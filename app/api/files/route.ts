import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyUserToken } from "@/lib/jwt";
import { participatesInProject } from "@/lib/permissions";
import { uploadToS3 } from "@/lib/s3";
import { FileModel } from "@/models/File";

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

// GET /api/files?projectId=...
export async function GET(req: Request) {
  await connectDB();

  const user = requireAuth(req);
  if (!user) return NextResponse.json({ message: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ message: "Falta projectId" }, { status: 400 });
  }

  const canSee = await participatesInProject(user.sub, String(projectId));
  if (!canSee) {
    return NextResponse.json({ message: "Proyecto no accesible" }, { status: 403 });
  }

  const docs = await FileModel.find({ projectId: projectId as any })
    .sort({ createdAt: -1 })
    .lean();

  const files = docs.map((d: any) => ({
    id: String(d._id),
    projectId: String(d.projectId),
    key: d.key as string,
    url: d.url as string,
    originalName: d.originalName as string,
    size: Number(d.size),
    contentType: typeof d.contentType === "string" ? (d.contentType as string) : undefined,
    uploadedBy: d.uploadedBy ? String(d.uploadedBy) : undefined,
    createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : undefined,
  }));

  return NextResponse.json({ files }, { status: 200 });
}

// POST /api/files (multipart/form-data)
// form fields: file (Blob), projectId (string)
export async function POST(req: Request) {
  await connectDB();

  const user = requireAuth(req);
  if (!user) return NextResponse.json({ message: "No autorizado" }, { status: 401 });

  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const projectId = form.get("projectId");

    if (!file || !projectId || typeof projectId !== "string") {
      return NextResponse.json({ message: "Faltan campos: file, projectId" }, { status: 400 });
    }

    const canUpload = await participatesInProject(user.sub, String(projectId));
    if (!canUpload) {
      return NextResponse.json({ message: "Proyecto no accesible" }, { status: 403 });
    }

    const arrayBuf = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);
    const contentType = file.type || "application/octet-stream";
    const originalName = (file as any).name || "upload.bin";
    const timestamp = Date.now();
    const safeName = originalName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const key = `${projectId}/${timestamp}-${safeName}`;

    const { url } = await uploadToS3({
      key,
      body: buffer,
      contentType,
    });

    const created = await FileModel.create({
      projectId,
      key,
      url,
      originalName,
      size: buffer.length,
      contentType,
      uploadedBy: user.sub,
    });

    return NextResponse.json(
      {
        file: {
          id: String((created as any)._id),
          projectId: String(created.projectId),
          key: created.key,
          url: created.url,
          originalName: created.originalName,
          size: created.size,
          contentType: created.contentType,
          uploadedBy: created.uploadedBy ? String(created.uploadedBy) : undefined,
          createdAt: (created as any)?.createdAt?.toISOString?.() ?? new Date((created as any)?.createdAt).toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error subiendo archivo:", err);
    return NextResponse.json({ message: "Error interno al subir archivo" }, { status: 500 });
  }
}
