import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";
import { signUserToken } from "@/lib/jwt";

export async function POST(req: Request) {
  await connectDB();

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Correo o contraseña vacíos" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user || !user.password) {
      return NextResponse.json(
        { message: "Correo o contraseña incorrectos" },
        { status: 401 }
      );
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return NextResponse.json(
        { message: "Correo o contraseña incorrectos" },
        { status: 401 }
      );
    }

    const token = signUserToken(user);

    // 🔥 CORREGIDO: agregar avatarUrl al usuario respondido
    const safeUser = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl ?? null,   // ← IMPORTANTE
    };

    return NextResponse.json({ user: safeUser, token }, { status: 200 });
  } catch (error) {
    console.error("Error en /api/auth/login:", error);
    return NextResponse.json(
      { message: "Error interno al iniciar sesión" },
      { status: 500 }
    );
  }
}
