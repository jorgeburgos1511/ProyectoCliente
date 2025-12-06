import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { FileModel } from "@/models/File";
import { deleteFromS3 } from "@/lib/s3";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  await connectDB();

  const { fileId } = await params;

  try {
    const fileDoc = await FileModel.findById(fileId);
    if (!fileDoc) {
      return NextResponse.json(
        { message: "Archivo no encontrado" },
        { status: 404 }
      );
    }

    // borrar de S3
    try {
      await deleteFromS3(fileDoc.key);
    } catch (err) {
      console.error("Error borrando de S3:", err);
    }

    // borrar de Mongo
    await fileDoc.deleteOne();

    return NextResponse.json({ message: "Archivo eliminado" }, { status: 200 });
  } catch (err) {
    console.error("Error eliminando archivo:", err);
    return NextResponse.json(
      { message: "Error eliminando archivo" },
      { status: 500 }
    );
  }
}
