// app/api/projects/[id]/files/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { FileModel } from "@/models/File";
import { uploadToS3 } from "@/lib/s3";

// GET: lista de archivos
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();

  const { id } = await params;

  try {
    const docs = await FileModel.find({ projectId: id })
      .sort({ createdAt: -1 })
      .lean();

    const files = docs.map((d: any) => ({
      _id: d._id.toString(),
      key: d.key,
      url: d.url,
      originalName: d.originalName,
      size: d.size,
      createdAt: d.createdAt,
    }));

    return NextResponse.json({ files }, { status: 200 });
  } catch (err) {
    console.error("Error obteniendo archivos:", err);
    return NextResponse.json(
      { message: "Error obteniendo archivos" },
      { status: 500 }
    );
  }
}

// POST: subir archivo
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();


  const { id: projectId } = await params;

  try {
    const form = await req.formData();
    const fileEntry = form.get("file");

    if (!(fileEntry instanceof File)) {
      return NextResponse.json(
        { message: "Archivo no válido" },
        { status: 400 }
      );
    }

    const arrayBuffer = await fileEntry.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const ext = fileEntry.name.split(".").pop() ?? "bin";
    const key = `projects/${projectId}/${Date.now()}-${Math.random()
      .toString(16)
      .slice(2)}.${ext}`;

    const { url } = await uploadToS3({
      key,
      body: buffer,
      contentType: fileEntry.type || "application/octet-stream",
    });

    const doc = await FileModel.create({
      projectId,
      key,
      url,
      originalName: fileEntry.name,
      size: fileEntry.size,
      uploadedBy: projectId, 
    });

    return NextResponse.json(
      {
        file: {
          _id: (doc as any)._id.toString(),
          key: doc.key,
          url: doc.url,
          originalName: doc.originalName,
          size: doc.size,
          createdAt: doc.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error subiendo archivo:", err);
    return NextResponse.json(
      { message: "Error subiendo archivo" },
      { status: 500 }
    );
  }
}
