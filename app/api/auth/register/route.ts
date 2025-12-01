import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";
import { signUserToken } from "@/lib/jwt";

export async function POST(req: Request) {
  await connectDB();

  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Faltan datos para el registro" },
        { status: 400 }
      );
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json(
        { message: "Ya existe un usuario con ese correo" },
        { status: 409 }
      );
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashed,
      provider: "credentials",
      role: "developer",
      avatarUrl: null, // 🔥 Ya definimos campo inicial (puedes poner default)
    });

    const token = signUserToken(user);

    // 🔥 CORREGIDO: Incluir avatarUrl en la respuesta
    const safeUser = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl ?? null,
    };

    return NextResponse.json({ user: safeUser, token }, { status: 201 });
  } catch (error) {
    console.error("Error en /api/auth/register:", error);
    return NextResponse.json(
      { message: "Error interno al registrar" },
      { status: 500 }
    );
  }
}
