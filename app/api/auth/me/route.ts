import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyUserToken } from "@/lib/jwt";
import { User } from "@/models/User";

export async function GET(req: Request) {
  try {
    await connectDB();

    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer", "").trim();

    if (!token) {
      return NextResponse.json(
        { message: "No autorizado" },
        { status: 401 }
      );
    }

    let payload;
    try {
      payload = verifyUserToken(token);
    } catch {
      return NextResponse.json(
        { message: "Token inválido" },
        { status: 401 }
      );
    }

    const user = await User.findById(payload.sub);
    if (!user) {
      return NextResponse.json(
        { message: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // 🔥 Aquí resolvemos los warnings de TypeScript
    const u = user.toObject() as any;

    return NextResponse.json(
      {
        success: true,
        user: {
          _id: u._id.toString(),
          name: u.name,
          email: u.email,
          role: u.role,
          avatarUrl: u.avatarUrl ?? null,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error en /api/auth/me:", err);
    return NextResponse.json(
      { message: "Error interno" },
      { status: 500 }
    );
  }
}
