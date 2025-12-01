import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { verifyUserToken } from "@/lib/jwt";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "").replace("Bearer", "").trim();

    if (!token) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    let payload;
    try {
      payload = verifyUserToken(token);
    } catch {
      return NextResponse.json({ message: "Token inválido" }, { status: 401 });
    }

    const { avatarUrl } = await req.json();

    if (!avatarUrl || typeof avatarUrl !== "string") {
      return NextResponse.json(
        { message: "avatarUrl requerido" },
        { status: 400 }
      );
    }

    await connectDB();

    const updated = await User.findByIdAndUpdate(
      payload.sub,
      { avatarUrl },
      { new: true }
    ).lean();

    if (!updated) {
      return NextResponse.json(
        { message: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // 👇 FIX: TS no reconoce avatarUrl en objetos lean()
    const updatedUser = updated as unknown as { avatarUrl?: string };

    return NextResponse.json(
      {
        success: true,
        avatarUrl: updatedUser.avatarUrl ?? null,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error en /api/profile/avatar:", err);
    return NextResponse.json(
      { message: "Error al guardar avatar" },
      { status: 500 }
    );
  }
}
